<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useGamesStore } from '../stores/games'

const authStore = useAuthStore()
const gamesStore = useGamesStore()

const recentGames = ref([])
const playerStats = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    await gamesStore.fetchGames()
    recentGames.value = gamesStore.games.slice(0, 5)
    
    // Calculate player stats from games
    const leaderboard = await gamesStore.fetchLeaderboard()
    playerStats.value = leaderboard.find(p => p.id === authStore.user?.id)
  } catch (error) {
    console.error('Failed to load dashboard:', error)
  } finally {
    loading.value = false
  }
})

const totalPoints = computed(() => playerStats.value?.totalPoints || 0)
const gamesPlayed = computed(() => playerStats.value?.gamesPlayed || 0)
</script>

<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>Welcome, {{ authStore.user?.name }}!</h1>
      <p v-if="authStore.isAdmin" class="admin-badge">Admin</p>
    </header>

    <div v-if="loading" class="loading">Loading dashboard...</div>
    
    <div v-else class="dashboard-content">
      <section class="stats-section">
        <div class="stat-card">
          <div class="stat-value">{{ totalPoints }}</div>
          <div class="stat-label">Total Points</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ gamesPlayed }}</div>
          <div class="stat-label">Games Played</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ playerStats?.rank || '-' }}</div>
          <div class="stat-label">Current Rank</div>
        </div>
      </section>

      <section class="recent-games">
        <div class="section-header">
          <h2>Recent Games</h2>
          <router-link to="/games" class="view-all">View All →</router-link>
        </div>
        
        <div v-if="recentGames.length === 0" class="empty-state">
          <p>No games yet. Join a game to start tracking your scores!</p>
        </div>
        
        <div v-else class="games-list">
          <div v-for="game in recentGames" :key="game.id" class="game-card">
            <div class="game-info">
              <h3>{{ game.name }}</h3>
              <p class="game-date">{{ new Date(game.createdAt).toLocaleDateString() }}</p>
            </div>
            <div class="game-status" :class="game.status">
              {{ game.status }}
            </div>
            <router-link :to="`/games/${game.id}`" class="btn-view">View</router-link>
          </div>
        </div>
      </section>

      <section v-if="authStore.isAdmin" class="admin-section">
        <h2>Admin Quick Actions</h2>
        <div class="admin-actions">
          <router-link to="/admin/games" class="admin-btn">
            🎮 Start New Game
          </router-link>
          <router-link to="/admin/templates" class="admin-btn">
            📋 Manage Templates
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 900px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  color: #fff;
}

.admin-badge {
  background: #f6ad55;
  color: #1a202c;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #a0aec0;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: #4299e1;
}

.stat-label {
  color: #a0aec0;
  margin-top: 0.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h2 {
  color: #fff;
}

.view-all {
  color: #4299e1;
  text-decoration: none;
}

.empty-state {
  background: #2d3748;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  color: #a0aec0;
}

.games-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.game-card {
  background: #2d3748;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.game-info {
  flex: 1;
}

.game-info h3 {
  color: #fff;
  margin: 0;
}

.game-date {
  color: #a0aec0;
  font-size: 0.875rem;
  margin: 0;
}

.game-status {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  text-transform: capitalize;
}

.game-status.active {
  background: #c6f6d5;
  color: #22543d;
}

.game-status.ended {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-view {
  background: #4299e1;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  font-size: 0.875rem;
}

.admin-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #4a5568;
}

.admin-section h2 {
  color: #f6ad55;
  margin-bottom: 1rem;
}

.admin-actions {
  display: flex;
  gap: 1rem;
}

.admin-btn {
  background: #2d3748;
  color: #fff;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.2s;
}

.admin-btn:hover {
  background: #4a5568;
}
</style>
