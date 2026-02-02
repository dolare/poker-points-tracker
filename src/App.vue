<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from './stores/auth'
import Navbar from './components/Navbar.vue'

const authStore = useAuthStore()
const loading = ref(true)

onMounted(async () => {
  try {
    await authStore.checkAuth()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="app">
    <Navbar />
    <main class="main-content">
      <div v-if="loading" class="loading-screen">
        <p>Loading...</p>
      </div>
      <router-view v-else />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>
