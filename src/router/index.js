import { createRouter, createWebHistory } from 'vue-router'
import ProductListPage from '@/views/ProductListPage.vue'
import ProductAddPage from '@/views/ProductAddPage.vue'

const routes = [
  { path: '/products', name: 'products', component: ProductListPage },
  { path: '/products/add', name: 'product-add', component: ProductAddPage }, // ⬅️ Tambah ini
  {
    path: '/products/edit/:id',
    name: 'ProductEdit',
    component: () => import('@/views/ProductEdit.vue'),
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
