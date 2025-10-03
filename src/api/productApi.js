// src/api/productApi.js
import axios from 'axios'

const api = axios.create({
  baseURL: 'https://api.sandbox.kasheer.id/api/v2/management/product',
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_API_TOKEN}`
  }
})

export const fetchProductList = (params) =>
  api.post('/item/list', params)

// note: do NOT set Content-Type here; let axios set boundary for FormData
export const createProduct = (formData) => {
  return api.post('/item/add', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const fetchProductDetail = (id) => {
  const formData = new FormData()
  
  formData.append('id_barang', Number(id))

  return api.post('/item/detail', formData)
}

// ⚡ Kategori pakai API v1
export const fetchCategories = () =>
  axios.post(
    'https://api.sandbox.kasheer.id/api/v1/management/product/item/category',
    {},
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_API_TOKEN}`
      }
    }
  )

export const deleteProduct = (id) => {
  const formData = new FormData()
  formData.append('item', id)

  return api.post('/item/delete', formData)
}

// update product
export const updateProduct = (formData) => {
  return api.post('/item/edit', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const fetchAddonList = () =>
  api.post('/item/addonlist')