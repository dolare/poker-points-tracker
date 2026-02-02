import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import github from '../services/github'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLoggedIn = ref(false)
  const data = ref(null)

  const isAuthenticated = computed(() => isLoggedIn.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const hasWriteAccess = computed(() => github.hasToken())

  // Load data from GitHub
  async function loadData() {
    data.value = await github.readData()
    return data.value
  }

  // Save data to GitHub
  async function saveData() {
    if (!data.value) return
    await github.writeData(data.value)
  }

  // Login with email and password
  async function login(email, password) {
    if (!data.value) {
      await loadData()
    }

    // Find user by email
    const player = data.value.players.find(p => p.email === email)
    if (!player) {
      throw new Error('User not found')
    }

    // Check password (admin only has password)
    if (player.role === 'admin') {
      if (password !== data.value.admin.password) {
        throw new Error('Invalid password')
      }
    }

    user.value = player
    isLoggedIn.value = true
    localStorage.setItem('poker_user', JSON.stringify(player))
    
    return player
  }

  // Set GitHub token for write access
  async function setGitHubToken(token) {
    const valid = await github.verifyToken(token)
    if (!valid) {
      throw new Error('Invalid GitHub token')
    }
    github.setToken(token)
    return true
  }

  // Check if already logged in (from localStorage)
  async function checkAuth() {
    const savedUser = localStorage.getItem('poker_user')
    if (savedUser) {
      user.value = JSON.parse(savedUser)
      isLoggedIn.value = true
    }
    await loadData()
  }

  // Update profile
  async function updateProfile(name) {
    if (!user.value || !data.value) return

    const playerIndex = data.value.players.findIndex(p => p.id === user.value.id)
    if (playerIndex === -1) return

    data.value.players[playerIndex].name = name
    user.value.name = name
    
    await saveData()
    localStorage.setItem('poker_user', JSON.stringify(user.value))
    
    return user.value
  }

  function logout() {
    user.value = null
    isLoggedIn.value = false
    localStorage.removeItem('poker_user')
    github.clearToken()
  }

  return {
    user,
    data,
    isAuthenticated,
    isAdmin,
    hasWriteAccess,
    login,
    logout,
    checkAuth,
    loadData,
    saveData,
    updateProfile,
    setGitHubToken
  }
})
