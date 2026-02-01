import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    token.value = response.data.token
    user.value = response.data.user
    localStorage.setItem('token', response.data.token)
    return response.data
  }

  async function register(name, email, password) {
    const response = await api.post('/auth/register', { name, email, password })
    token.value = response.data.token
    user.value = response.data.user
    localStorage.setItem('token', response.data.token)
    return response.data
  }

  async function fetchUser() {
    if (!token.value) return null
    try {
      const response = await api.get('/auth/me')
      user.value = response.data
      return response.data
    } catch (error) {
      logout()
      return null
    }
  }

  async function updateProfile(name) {
    const response = await api.put('/auth/profile', { name })
    user.value = response.data
    return response.data
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login,
    register,
    fetchUser,
    updateProfile,
    logout
  }
})
