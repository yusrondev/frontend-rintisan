import { defineStore } from 'pinia'
import { fetchProductList, createProduct, fetchAddonList, fetchProductDetail, deleteProduct, fetchCategories, updateProduct } from '@/api/productApi'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [],
    addons: [],
    categories: [],
    totalItems: 0,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchProducts({ page = 1, active = 1, page_count = 5, search = "" } = {}) {
      this.loading = true
      this.error = null
      try {
        const res = await fetchProductList({ search, page_count, active, page })
        const responseData = res.data?.data
        
        // Pastikan struktur response sesuai
        console.log('API Response:', responseData) // Debug untuk melihat struktur
        
        const rawProducts = responseData?.data || responseData || []

        const totalFromAPI = responseData?.total || 
                      responseData?.meta?.total || 
                      responseData?.pagination?.total
        
        this.products = rawProducts.map(p => ({
          ...p,
          categoryName: p.category && typeof p.category === 'object'
            ? (p.category.name || '-')
            : (p.category || '-'),
          subName: p.subName || p.sub_name || '',
          updatedAtFormatted: p.updated_at
            ? format(new Date(p.updated_at), 'dd/MM/yyyy HH:mm', { locale: id })
            : '-'
        }))

        this.totalItems = totalFromAPI || rawProducts.length // Hati-hati dengan fallback ini
                        
        console.log('Total Items:', this.totalItems) // Debug
  } catch (err) {
    console.error(err)
    this.error = err
  } finally {
    this.loading = false
  }
},

    async fetchProductDetail(id) {
      this.loading = true
      try {
        const res = await fetchProductDetail(id)

        this.selectedProduct = res.data.data
        return res.data.data;

      } finally {
        this.loading = false
      }
    },

    async addProduct(data) {
      this.loading = true
      this.error = null
      try {
        const res = await createProduct(data) // sudah JSON langsung
        return res.data
      } catch (err) {
        console.error('createProduct error:', err.response?.data || err.message)
        this.error = err
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchAddons() {
      try {
        const res = await fetchAddonList()
        this.addons = (res.data?.data || []).map(a => ({
          label: a.name,
          value: a.id
        }))
      } catch (err) {
        console.error('Gagal fetch addon', err)
      }
    },

    async fetchCategories() {
      try {
        const res = await fetchCategories()
        return res
      } catch (err) {
        console.error('Gagal fetch addon', err)
      }
    },

    async deleteProduct(id) {
      this.loading = true
      this.error = null
      try {
        const res = await deleteProduct(id)
        return res.data
      } catch (err) {
        console.error(err)
        this.error = err
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateProduct(productId, formData) {
      this.loading = true
      this.error = null
      try {
        const res = await updateProduct(formData)
        return res.data
      } catch (err) {
        console.error('updateProduct error:', err.response?.data || err.message)
        this.error = err
        throw err
      } finally {
        this.loading = false
      }
    },

  }
})
