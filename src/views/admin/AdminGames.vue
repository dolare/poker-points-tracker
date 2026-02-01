<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGamesStore } from '../../stores/games'

const router = useRouter()
const gamesStore = useGamesStore()
const loading = ref(true)
const showModal = ref(false)

const formData = ref({
  name: '',
  templateId: '',
  selectedPlayers: []
})

onMounted(async () => {
  try {
    await Promise.all([
      gamesStore.fetchTemplates(),
      gamesStore.fetchPlayers(),
      gamesStore.fetchGames()
    ])
  } finally {
    loading.value = false
  }
})

const selectedTemplate = computed(() => {
  return gamesStore.templates.find(t => t.id === formData.value.templateId)
})

const activeGames = computed(() => {
  return gamesStore.games.filter(g => g.status === 'active')
})

function togglePlayer(playerId) {
  const index = formData.value.selectedPlayers.indexOf(playerId)
  if (index > -1) {
    formData.value.selectedPlayers.splice(index, 1)
  } else {
    formData.value.selectedPlayers.push(playerId)
  }
}

async function createGame() {
  if (!formData.value.name || !formData.value.templateId) {
    alert('Please fill in all required fields')
    return
  }
  
  try {
    const game = await gamesStore.createGame({
      name: formData.value.name,
      templateId: formData.value.templateId,
      playerIds: formData.value.selectedPlayers
    })
    showModal.value = false
    router.push(`/games/${game.id}`)
  } catch (err) {
    alert('Failed to create game')
  }
}

function openCreateModal() {
  formData.value = {
    name: '',
    templateId: gamesStore.templates[0]?.id || '',
    selectedPlayers: []
  }
  showModal.value = true
}
</script>

<template>
  <div class="admin-games-page">
    <header class="page-header">
      <h1>🎮 Manage Games</h1>
      <button @click="openCreateModal" class="btn btn-primary">
        + Start New Game
      </button>
    </header>

    <div v-if="loading" class="loading">Loading...</div>
    
    <template v-else>
      <section class="active-games-section">
        <h2>Active Games</h2>
        <div v-if="activeGames.length === 0" class="empty-state">
          No active games. Start a new game!
        </div>
        <div v-else class="games-list">
          <router-link 
            v-for="game in activeGames" 
            :key="game.id"
            :to="`/games/${game.id}`"
            class="game-card"
          >
            <div class="game-info">
              <h3>{{ game.name }}</h3>
              <p>{{ game.playerCount }} players • {{ game.templateName }}</p>
            </div>
            <span class="status-badge active">Active</span>
          </router-link>
        </div>
      </section>

      <section class="all-games-section">
        <h2>All Games</h2>
        <div class="games-list">
          <router-link 
            v-for="game in gamesStore.games" 
            :key="game.id"
            :to="`/games/${game.id}`"
            class="game-card"
          >
            <div class="game-info">
              <h3>{{ game.name }}</h3>
              <p>{{ game.playerCount }} players • {{ new Date(game.createdAt).toLocaleDateString() }}</p>
            </div>
            <span :class="['status-badge', game.status]">{{ game.status }}</span>
          </router-link>
        </div>
      </section>
    </template>

    <!-- Create Game Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h3>Start New Game</h3>
        <form @submit.prevent="createGame">
          <div class="form-group">
            <label for="gameName">Game Name</label>
            <input
              type="text"
              id="gameName"
              v-model="formData.name"
              required
              placeholder="e.g., Friday Night Poker"
            />
          </div>
          
          <div class="form-group">
            <label for="template">Game Template</label>
            <select id="template" v-model="formData.templateId" required>
              <option value="">Select a template...</option>
              <option v-for="template in gamesStore.templates" :key="template.id" :value="template.id">
                {{ template.name }} ({{ template.basePoints }} base points)
              </option>
            </select>
          </div>

          <div v-if="selectedTemplate" class="template-info">
            <p>Base Points: <strong>{{ selectedTemplate.basePoints }}</strong></p>
          </div>
          
          <div class="form-group">
            <label>Select Players</label>
            <div class="players-grid">
              <div 
                v-for="player in gamesStore.players" 
                :key="player.id"
                :class="['player-chip', { selected: formData.selectedPlayers.includes(player.id) }]"
                @click="togglePlayer(player.id)"
              >
                {{ player.name }}
              </div>
            </div>
            <small>{{ formData.selectedPlayers.length }} players selected</small>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="showModal = false" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Start Game
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-games-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  color: #f6ad55;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: #4299e1;
  color: #fff;
}

.btn-secondary {
  background: #4a5568;
  color: #fff;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #a0aec0;
}

section {
  margin-bottom: 2rem;
}

section h2 {
  color: #fff;
  margin-bottom: 1rem;
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
  gap: 0.75rem;
}

.game-card {
  background: #2d3748;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-decoration: none;
  transition: background 0.2s;
}

.game-card:hover {
  background: #4a5568;
}

.game-info h3 {
  color: #fff;
  margin: 0;
}

.game-info p {
  color: #a0aec0;
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #2d3748;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  color: #fff;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  color: #e2e8f0;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #4a5568;
  border-radius: 8px;
  background: #1a202c;
  color: #fff;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4299e1;
}

.form-group small {
  color: #718096;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: block;
}

.template-info {
  background: #1a202c;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  color: #a0aec0;
}

.template-info strong {
  color: #4299e1;
}

.players-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.player-chip {
  background: #4a5568;
  color: #e2e8f0;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.player-chip:hover {
  background: #5a6678;
}

.player-chip.selected {
  background: #4299e1;
  color: #fff;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
</style>
