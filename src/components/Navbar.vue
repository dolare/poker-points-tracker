<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <nav class="navbar">
    <div class="navbar-container">
      <router-link to="/" class="navbar-brand">
        🎴 Poker Points
      </router-link>
      
      <div class="navbar-links">
        <router-link to="/leaderboard" class="nav-link">Leaderboard</router-link>
        
        <template v-if="authStore.isAuthenticated">
          <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
          <router-link to="/games" class="nav-link">Games</router-link>
          
          <template v-if="authStore.isAdmin">
            <router-link to="/admin/players" class="nav-link admin-link">Players</router-link>
            <router-link to="/admin/templates" class="nav-link admin-link">Templates</router-link>
            <router-link to="/admin/games" class="nav-link admin-link">Manage Games</router-link>
          </template>
          
          <div class="user-menu">
            <router-link to="/profile" class="nav-link user-link">
              {{ authStore.user?.name || 'Profile' }}
            </router-link>
            <button @click="logout" class="btn-logout">Logout</button>
          </div>
        </template>
        
        <template v-else>
          <router-link to="/login" class="nav-link btn-login">Login</router-link>
        </template>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-brand {
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
  text-decoration: none;
}

.navbar-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  color: #a0aec0;
  text-decoration: none;
  transition: color 0.2s;
  font-weight: 500;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #fff;
}

.admin-link {
  color: #f6ad55;
}

.admin-link:hover {
  color: #ed8936;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: 1rem;
  padding-left: 1rem;
  border-left: 1px solid #4a5568;
}

.user-link {
  color: #68d391;
}

.btn-logout {
  background: transparent;
  border: 1px solid #e53e3e;
  color: #fc8181;
  padding: 0.4rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: #e53e3e;
  color: #fff;
}

.btn-login {
  background: #4299e1;
  color: #fff !important;
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

.btn-login:hover {
  background: #3182ce;
}
</style>
