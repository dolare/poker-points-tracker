<script setup>
import { ref, onMounted, computed } from 'vue'
import { useGamesStore } from '../stores/games'

const gamesStore = useGamesStore()
const loading = ref(true)
const filter = ref('all')

onMounted(async () => {
  try {
    await gamesStore.fetchGames()
  } finally {
    loading.value = false
  }
})

const filteredGames = computed(() => {
  if (filter.value === 'all') return gamesStore.games
  return gamesStore.games.filter(g => g.status === filter.value)
})
</script>

<template>
  <div class="games-page">
    <header class="page-header">
      <h1>Games</h1>
      <div class="filters">
        <button 
          :class="['filter-btn', { active: filter === 'all' }]"
          @click="filter = 'all'"
        >All</button>
        <button 
          :class="['filter-btn', { active: filter === 'active' }]"
          @click="filter = 'active'"
        >Active</button>
        <button 
          :class="['filter-btn', { active: filter === 'ended' }]"
          @click="filter = 'ended'"
        >Ended</button>
      </div>
    </header>

    <div v-if="loading" class="loading">Loading games...</div>
    
    <div v-else-if="filteredGames.length === 0" class="empty-state">
      <p>No games found.</p>
    </div>
    
    <div v-else class="games-grid">
      <router-link 
        v-for="game in filteredGames" 
        :key="game.id"
        :to="`/games/${game.id}`"
        class="game-card"
      >
        <div class="game-header">
          <h3>{{ game.name }}</h3>
          <span :class="['status-badge', game.status]">{{ game.status }}</span>
        </div>
        <div class="game-meta">
          <span>📅 {{ new Date(game.createdAt).toLocaleDateString() }}</span>
          <span>👥 {{ game.playerCount || 0 }} players</span>
        </div>
        <div class="game-template">
          Template: {{ game.templateName || 'Custom' }}
        </div>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.games-page {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  color: #fff;
}

.filters {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  background: #2d3748;
  border: none;
  color: #a0aec0;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #4a5568;
}

.filter-btn.active {
  background: #4299e1;
  color: #fff;
}

.loading, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #a0aec0;
  background: #2d3748;
  border-radius: 12px;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.game-card {
  background: #2d3748;
  padding: 1.5rem;
  border-radius: 12px;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.game-header h3 {
  color: #fff;
  margin: 0;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
}

.status-badge.active {
  background: #c6f6d5;
  color: #22543d;
}

.status-badge.ended {
  background: #e2e8f0;
  color: #4a5568;
}

.game-meta {
  display: flex;
  gap: 1rem;
  color: #a0aec0;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.game-template {
  color: #718096;
  font-size: 0.875rem;
}
</style>
