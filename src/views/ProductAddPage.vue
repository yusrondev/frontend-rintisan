<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/store/productStore'
import { useMetaStore } from '@/store/metaStore'   // ⬅️ import metaStore
import {
  NForm, NFormItem, NInput, NSelect, NUpload, NButton, NSpace, NSwitch, NTable, NIcon, NConfigProvider
} from 'naive-ui'
import { TrashOutline } from '@vicons/ionicons5'

import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

// store
const productStore = useProductStore()
const metaStore = useMetaStore()
const router = useRouter()

// form state
const form = ref({
  name: '',
  description: '',
  category_id: null,
  price: '',
  sku: '',
  unit: '',
  image: null,
  addons: []
})

const selectedAddon = ref(null)

// computed
const addonLimitReached = computed(() => form.value.addons.length >= 5)
const isFormValid = computed(() =>
  form.value.name &&
  form.value.category_id &&
  form.value.price &&
  form.value.sku &&
  form.value.unit &&
  form.value.image
)

// lifecycle → ambil kategori & addon dari API
onMounted(() => {
  metaStore.loadCategories()
  metaStore.loadAddons()
})

// add addon
function addAddon() {
  if (selectedAddon.value && !addonLimitReached.value) {
    const exists = form.value.addons.find(a => a.id === selectedAddon.value)
    if (exists) return // jangan tambah lagi
    
    const selected = metaStore.addons.find(o => o.value === selectedAddon.value)
    form.value.addons.push({
      id: selected.value,
      name: selected.label,
      active: true,
      count: 1
    })
    selectedAddon.value = null

    console.log(selected);
    
  }
}


// remove addon
function removeAddon(id) {
  form.value.addons = form.value.addons.filter(a => a.id !== id)
}

// toggle status addon
function toggleAddonStatus(addon) {
  addon.active = !addon.active
}

// upload handler
function handleUpload({ file }) {
  // simpan file asli (File object), bukan wrapper dari Naive UI
  form.value.image = file.file
}

// submit
// submit
async function handleSubmit() {
  if (!isFormValid.value) {
    window.alert("Lengkapi semua field yang wajib!")
    return
  }

  const formData = new FormData()

  const data_barang = {
    nama_barang: form.value.name,
    kategori: Number(form.value.category_id),
    sku: form.value.sku,
    barcode: null,
    harga: Number(form.value.price),
    unit: form.value.unit,
    deskripsi: form.value.description || '',
    as_addon: false,
    add_on: form.value.addons.map(a => ({
      id: a.id,
      is_active: a.active,
      count: a.count
    })),
    has_addon: form.value.addons.length > 0,
    has_variant: false
  }

  formData.append("data_barang", JSON.stringify(data_barang))
  formData.append("gambar", form.value.image || "")

  try {
    await productStore.addProduct(formData)
    await Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: 'Produk berhasil disimpan.',
      showConfirmButton: true,
      confirmButtonColor: '#0b557f'
    })
    router.push("/products")
  } catch (err) {
    console.error("Gagal simpan produk", err.response?.data || err)
    window.alert(err.response?.data?.meta?.message || "Gagal simpan produk")
  }
}

// 🎨 Override warna hijau default Naive UI → biru brand (#0b557f)
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
    <div class="p-6 bg-white rounded-lg shadow-sm">
      <h2 class="text-lg font-bold mb-4">Tambah Barang Baru</h2>

      <n-form>
        <!-- Info Barang -->
        <n-form-item label="Nama Barang" required>
          <n-input v-model:value="form.name" placeholder="Contoh: Ayam Goreng" />
        </n-form-item>

        <n-form-item label="Deskripsi Barang">
          <n-input v-model:value="form.description" type="textarea" placeholder="Opsional" />
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

        <n-form-item label="Foto Barang" required>
          <n-upload
            :max="1"
            accept=".png,.jpg,.jpeg"
            :default-upload="false"
            @change="handleUpload"
          >
            <n-button>Unggah Foto</n-button>
          </n-upload>
        </n-form-item>

        <!-- Harga -->
        <n-form-item label="Harga" required>
          <n-input v-model:value="form.price" type="number" placeholder="Rp 0" />
        </n-form-item>

        <!-- Detail Barang -->
        <n-form-item label="Kode Barang (SKU)" required>
          <n-input v-model:value="form.sku" placeholder="Contoh: AG001" />
        </n-form-item>

        <n-form-item label="Unit Barang" required>
          <n-input v-model:value="form.unit" placeholder="Contoh: kg, pcs, unit" />
        </n-form-item>

        <!-- Add On -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium">Add On ({{ form.addons.length }}/5)</span>
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

          <n-table v-if="form.addons.length">
            <thead>
              <tr>
                <th>Nama Add On</th>
                <th>Status</th>
                <th>Jumlah</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="addon in form.addons" :key="addon.id">
                <td>{{ addon.name }}</td>
                <td>
                  <n-switch v-model:value="addon.active" @update:value="toggleAddonStatus(addon)" />
                </td>
                <td>{{ addon.count }} Pilihan</td>
                <td>
                  <n-button quaternary type="error" @click="removeAddon(addon.id)">
                    <n-icon><TrashOutline /></n-icon>
                  </n-button>
                </td>
              </tr>
            </tbody>
          </n-table>
        </div>

        <!-- Action -->
        <n-space justify="end">
          <n-button @click="router.back()">Batal</n-button>
          <n-button type="primary" :disabled="!isFormValid" @click="handleSubmit">Simpan</n-button>
        </n-space>
      </n-form>
    </div>
  </n-config-provider>
</template>
