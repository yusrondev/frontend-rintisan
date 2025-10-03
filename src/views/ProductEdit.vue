<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NForm, NFormItem, NInput, NSelect, NUpload, NButton, NSwitch, NTable, NIcon
} from 'naive-ui'
import { TrashOutline } from '@vicons/ionicons5'
import { useProductStore } from '@/store/productStore'
import { useMetaStore } from '@/store/metaStore'

import isEqual from 'lodash.isequal'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

const route = useRoute()
const router = useRouter()
const store = useProductStore()
const metaStore = useMetaStore()

const productId = route.params.id
const formRef = ref(null)

const form = reactive({
  name: '',
  description: '',
  category_id: null,
  price: '',
  sku: '',
  unit: '',
  image: null,
  addons: []
})

const loading = ref(false)
const originalForm = ref(null)

// ✅ Load data produk
onMounted(async () => {
  loading.value = true
  try {
    const product = await store.fetchProductDetail(productId)

    // ✅ isi form dengan nama properti konsisten
    form.nama_barang = product.name
    form.deskripsi = product.description || ''
    form.sku = product.sku
    form.unit = product.unit
    form.harga = product.price
    form.category_id = product.category?.id || null
    form.gambar = product.image 
      ? `https://api.sandbox.kasheer.id/storage/${product.image}`
      : null

    form.addons = (product.add_on_link || []).map(link => ({
      id: link.id,
      name: link.add_on_group?.name || '',
      active: link.is_active === 1,
      count: link.add_on_group?.add_on_item_count || 1,
      flag: 'N' // dari backend
    }))

    // simpan snapshot asli untuk perbandingan
    originalForm.value = JSON.parse(JSON.stringify(form))
  } catch (err) {
    console.error('Gagal fetch detail:', err)
  } finally {
    loading.value = false
  }

  metaStore.loadCategories()
  metaStore.loadAddons()
})

// ✅ Tombol simpan aktif jika ada perubahan
const isChanged = computed(() => {
  return !isEqual(form, originalForm.value)
})

// ✅ Addon
const selectedAddon = ref(null)
const addonLimitReached = computed(() =>
  form.addons.filter(a => a.flag !== 'D').length >= 5
)

function addAddon() {
  if (!selectedAddon.value || addonLimitReached.value) return

  const exists = form.addons.find(a => a.id === selectedAddon.value && a.flag !== 'D')
  if (exists) return

  const selected = metaStore.addons.find(a => a.value === selectedAddon.value)
  if (!selected) return

  form.addons.push({
    id: selected.value,
    name: selected.label,
    active: true,
    count: 1,
    flag: 'A'
  })
  selectedAddon.value = null
}

function removeAddon(index) {
  const addon = form.addons[index]
  if (!addon) return
  if (addon.flag === 'A') {
    form.addons.splice(index, 1)
  } else if (addon.flag === 'N' || addon.flag === 'E') {
    addon.flag = 'D'
    form.addons.splice(index, 1)
  }
}

function toggleAddonStatus(addon) {
  addon.active = !addon.active
  if (addon.flag === 'N') addon.flag = 'E'
}

const handleUpload = ({ file }) => {
  if (!file) return
  // simpan file asli untuk FormData
  form.gambarFile = file.file ?? file.raw ?? null
}

const handleSave = async () => {
  const fd = new FormData()

  fd.append('data_barang', JSON.stringify({
    id: productId,
    nama_barang: form.nama_barang,
    kategori: form.category_id,
    sku: form.sku,
    barcode: null,
    harga: form.harga,
    unit: form.unit,
    deskripsi: form.deskripsi,
    as_addon: false,
    add_on: form.addons.map((a, idx) => {
      if(a.flag === 'N' || a.flag === 'E') {
        return { id_add_on_link: a.id, is_active: a.active ? 1 : 0, status: a.flag, position: idx + 1 }
      } else if(a.flag === 'A') {
        return { id_add_on_group: a.id, is_active: a.active ? 1 : 0, status: a.flag, position: idx + 1 }
      }
    }),
    has_addon: form.addons.length > 0,
    has_variant: false,
    variant_remake: false,
    variant_clear: false,
    variant_change: false
  }))

  if (form.gambarFile) {
    fd.append('gambar', form.gambarFile)
  } else {
    fd.append('gambar', '') // kirim field kosong jika tidak ada upload baru
  }

  try {
    await store.updateProduct(productId, fd)
    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: 'Produk berhasil diperbarui.',
      confirmButtonColor: '#0b557f'
    })
    router.push('/products')
  } catch (e) {
    Swal.fire({
      icon: 'error',
      title: 'Gagal!',
      text: e.response?.data?.meta?.message?.gambar?.[0] || e.message,
      confirmButtonColor: '#0b557f'
    })
  }
}

// ✅ Hapus produk
const handleDelete = async () => {
  const result = await Swal.fire({
    title: 'Yakin hapus produk ini?',
    text: 'Tindakan ini tidak bisa dibatalkan!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#0b557f',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal'
  })

  if (result.isConfirmed) {
    try {
      await store.deleteProduct(productId)
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Produk berhasil dihapus.',
        confirmButtonColor: '#0b557f'
      })
      router.push('/products')
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: e.response?.data?.meta?.message || e.message,
        confirmButtonColor: '#0b557f'
      })
    }
  }
}

const handleCancel = () => {
  router.push('/products')
}
</script>

<template>
  <div class="p-6 bg-white rounded-lg shadow-sm">
    <h2 class="text-xl font-semibold mb-4">Edit Produk</h2>

    <n-form ref="formRef" label-width="120" :model="form">

      <!-- Info Barang -->
      <n-form-item label="Nama Produk" path="nama_barang" required>
        <n-input v-model:value="form.nama_barang" placeholder="Contoh: Ayam Goreng" />
      </n-form-item>

      <n-form-item label="Deskripsi Produk">
        <n-input type="textarea" v-model:value="form.deskripsi" placeholder="Opsional" />
      </n-form-item>

      <!-- Organisasi Barang -->
      <n-form-item label="Kategori Barang" required>
        <n-select
          v-model:value="form.category_id"
          :options="metaStore.categories"
          placeholder="Pilih kategori"
          :loading="metaStore.loading"
        />
      </n-form-item>

     <n-form-item label="Foto Barang">
        <n-upload
          :max="1"
          accept=".png,.jpg,.jpeg"
          :default-upload="false"
          @change="handleUpload"
        >
          <n-button>Unggah Foto</n-button>
        </n-upload>

        <div v-if="form.gambar" class="mt-2">
          <img
            :src="typeof form.gambar === 'object' ? URL.createObjectURL(form.gambar) : form.gambar"
            alt="preview"
            class="w-24 h-24 object-cover rounded"
          />
        </div>
      </n-form-item>

      <!-- Harga -->
      <n-form-item label="Harga" required>
        <n-input
          type="number"
          v-model:value="form.harga"
          placeholder="Contoh: 10000"
        />

      </n-form-item>

      <!-- Detail Barang -->
      <n-form-item label="SKU" required>
        <n-input v-model:value="form.sku" placeholder="Contoh: AG001" />
      </n-form-item>

      <n-form-item label="Satuan" required>
        <n-input v-model:value="form.unit" placeholder="Contoh: kg, pcs" />
      </n-form-item>

      <!-- Add Ons -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <span class="font-medium">
            Add On ({{ form.addons.filter(a => a.flag !== 'D').length }}/5)
          </span>
        </div>

        <div class="flex gap-2 mb-2">
          <n-select
            v-model:value="selectedAddon"
            :options="metaStore.addons"
            placeholder="Pilih Add On"
            :disabled="addonLimitReached"
            :loading="metaStore.loading"
          />
          <n-button
            type="primary"
            ghost
            @click="addAddon"
            :disabled="!selectedAddon || addonLimitReached"
          >
            + Tambah
          </n-button>
        </div>

        <n-table v-if="form.addons.filter(a => a.flag !== 'D').length">
          <thead>
            <tr>
              <th>Nama Add On</th>
              <th>Status</th>
              <th>Jumlah</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(addon, index) in form.addons.filter(a => a.flag !== 'D')"
              :key="addon.id"
            >
              <td>{{ addon.name }}</td>
              <td>
                <n-switch
                  v-model:value="addon.active"
                  @update:value="toggleAddonStatus(addon)"
                />
              </td>
              <td>{{ addon.count }} Pilihan</td>
              <td>
                <n-button quaternary type="error" @click="removeAddon(index)">
                  <n-icon><TrashOutline /></n-icon>
                </n-button>
              </td>
            </tr>
          </tbody>
        </n-table>
      </div>

      <!-- Tombol aksi -->
      <div class="flex gap-3 mt-6">
        <n-button type="primary" :disabled="!isChanged" @click="handleSave">Simpan</n-button>
        <n-button @click="handleCancel">Batal</n-button>
        <n-button type="error" @click="handleDelete">Hapus</n-button>
      </div>
    </n-form>
  </div>
</template>
