// src/store/metaStore.js
import { defineStore } from 'pinia'
import { fetchCategories, fetchAddonList } from '@/api/productApi'

export const useMetaStore = defineStore('meta', {
  state: () => ({
    categories: [],
    addons: [],
    loading: false,
    error: null
  }),
  actions: {
    async loadCategories() {
      this.loading = true
      this.error = null
      try {
        const res = await fetchCategories()
        this.categories = (res.data?.data || []).map(c => ({
          label: c.name,
          value: c.id
        }))
      } catch (err) {
        this.error = err
      } finally {
        this.loading = false
      }
    },
    async loadAddons() {
      this.loading = true
      this.error = null
      try {
        const res = await fetchAddonList()
        this.addons = (res.data?.data || []).map(a => ({
          label: a.name,
          value: a.id
        }))
      } catch (err) {
        this.error = err
      } finally {
        this.loading = false
      }
    }
  }
})
