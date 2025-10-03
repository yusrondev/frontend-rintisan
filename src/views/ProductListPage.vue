<script setup>
import { ref, computed, h, onMounted, watch } from 'vue'
import {
  NDataTable,
  NSwitch,
  NInput,
  NButton,
  NSelect,
  NIcon,
  NConfigProvider
} from 'naive-ui'
import { ChevronDown } from '@vicons/ionicons5'
import { useProductStore } from '@/store/productStore'
import { useRouter } from 'vue-router'
import debounce from 'lodash/debounce'

const router = useRouter()
const store = useProductStore()

const search = ref('')
const page = ref(1)
const pageSize = ref(5)
const activeTab = ref('all') // 'all', 'active', 'inactive'

// Fetch produk ketika komponen mount
onMounted(() => {
  store.fetchProducts({ page_count: pageSize.value })
})

// Debounce search supaya nggak spam API
const fetchWithSearch = debounce((term) => {
  page.value = 1
  store.fetchProducts({ page: page.value, page_count: pageSize.value, search: term })
}, 400)

// Watch search
watch(search, (term) => {
  fetchWithSearch(term)
})

// Watch pageSize
watch(pageSize, (newSize) => {
  page.value = 1
  store.fetchProducts({ page: page.value, page_count: newSize, search: search.value })
})

// Hitung jumlah produk
const activeCount = computed(() => store.products.filter(p => p.active).length)
const inactiveCount = computed(() => store.products.filter(p => !p.active).length)
const allCount = computed(() => store.products.length)

// Filter produk untuk tab
const filteredProducts = computed(() => {
  let list = store.products
  if (activeTab.value === 'active') list = list.filter(p => p.active)
  else if (activeTab.value === 'inactive') list = list.filter(p => !p.active)
  return list
})

// Render badge varian / add-on
const renderBadge = (row) => {
  if (row.variants > 0) {
    return h('div', { class: 'flex items-center gap-1 cursor-pointer text-orange-500 bg-orange-100 px-2 py-0.5 rounded-md text-xs font-semibold' }, [
      `${row.variants} Varian`,
      h(NIcon, { component: ChevronDown })
    ])
  }
  if (row.addOns > 0) {
    return h('span', { class: 'text-blue-500 bg-blue-100 px-2 py-0.5 rounded-md text-xs font-semibold' }, `${row.addOns} Add On`)
  }
  return null
}

// Kolom tabel
const columns = [
  { type: 'selection', width: 60 },
  {
    title: 'Nama Barang',
    key: 'name',
    render(row) {
      return h('div', { class: 'flex items-center gap-3' }, [
        // Container gambar dengan fallback abu-abu
        h('div', {
          class: 'w-10 h-10 rounded-md flex-shrink-0 flex items-center justify-center bg-gray-200 overflow-hidden'
        }, row.image
          ? h('img', {
              src: `https://api.sandbox.kasheer.id/storage/${row.image}`,
              class: 'w-full h-full object-cover'
            })
          : h('span', { class: 'text-gray-500 text-xs' })
        ),
        // Nama dan subNama
        h('div', { class: 'flex flex-col' }, [
          h('span', {
            class: 'font-medium text-blue-600 cursor-pointer hover:underline',
            onClick: () => router.push(`/products/edit/${row.id}`)
          }, row.name),
          row.subName ? h('span', { class: 'text-xs text-gray-500' }, row.subName) : null
        ]),
        // Badge varian / add-on
        renderBadge(row)
      ])
    }
  },
  { title: 'Harga', key: 'price' },
  { title: 'Kategori', key: 'category.name' },
  { title: 'Tanggal Diperbaharui', key: 'updatedAtFormatted' },
  {
    title: 'Tindakan',
    key: 'actions',
    render(row) {
      return h(NSwitch, {
        value: row.active,
        onUpdateValue: () => {
          row.active = !row.active
          // update ke API bisa via store.updateProductStatus(row.id, row.active)
        }
      })
    }
  }
]

// Custom theme Naive UI
const customTheme = {
  common: {
    primaryColor: '#0b557f',
    primaryColorHover: '#0d6ea1',
    primaryColorPressed: '#094563',
    primaryColorSuppl: '#0b557f'
  }
}
</script>

<template>
  <n-config-provider :theme-overrides="customTheme">
    <div class="p-4 bg-gray-50 min-h-screen">
      <div class="p-6 bg-white rounded-lg shadow-sm">
        <!-- Header: Tabs + Search + PageSize + Button -->
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center gap-2">
            <button @click="activeTab = 'all'" :class="['tab-button', { 'active': activeTab === 'all' }]">
              Semua Barang <span class="tab-badge">{{ allCount }}</span>
            </button>
            <button @click="activeTab = 'active'" :class="['tab-button', { 'active': activeTab === 'active' }]">
              Aktif <span class="tab-badge">{{ activeCount }}</span>
            </button>
            <button @click="activeTab = 'inactive'" :class="['tab-button', { 'active': activeTab === 'inactive' }]">
              Nonaktif <span class="tab-badge">{{ inactiveCount }}</span>
            </button>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-600">Tampilkan</span>
            <n-select
              :options="[
                { label: '5', value: 5 },
                { label: '10', value: 10 },
                { label: '25', value: 25 },
                { label: '100', value: 100 }
              ]"
              v-model:value="pageSize"
              style="width: 80px;"
            />
            <n-input
              placeholder="Cari barang"
              v-model:value="search"
              clearable
              style="width: 200px;"
            />
            <n-button type="primary" strong @click="router.push('/products/add')">
              + Tambah Barang
            </n-button>
          </div>
        </div>

        <!-- Table -->
        <n-data-table
          :columns="columns"
          :data="store.products" 
          :row-key="row => row.id"
          :pagination="{
            page: page,
            pageSize: pageSize,
            itemCount: store.totalItems,
            onUpdatePage: (p) => {
              page.value = p
              store.fetchProducts({ page: p, page_count: pageSize.value, search: search.value })
            },
            onUpdatePageSize: (s) => {
              pageSize.value = s
              store.fetchProducts({ page: 1, page_count: s, search: search.value })
            }
          }"
        />
      </div>
    </div>
  </n-config-provider>
</template>

<style scoped>
.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  background-color: transparent;
  border: 1px solid #e0e0e6;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-button:hover {
  background-color: #f4f4f5;
}

.tab-button.active {
  color: #0b557f;
  background-color: #ecf8ff;
  border-color: #0b557f;
}

.tab-badge {
  background-color: #e0e0e6;
  color: #555;
  padding: 0px 6px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.tab-button.active .tab-badge {
  background-color: #0b557f;
  color: white;
}
</style>
