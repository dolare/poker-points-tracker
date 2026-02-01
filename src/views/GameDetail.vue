<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGamesStore } from '../stores/games'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const gamesStore = useGamesStore()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref('')
const editingPlayer = ref(null)
const newScore = ref(0)
const addingPlayer = ref(false)
const selectedPlayerId = ref('')

onMounted(async () => {
  try {
    await gamesStore.fetchGame(route.params.id)
    if (authStore.isAdmin) {
      await gamesStore.fetchPlayers()
    }
  } catch (err) {
    error.value = 'Failed to load game'
  } finally {
    loading.value = false
  }
})

const game = computed(() => gamesStore.currentGame)
const isActive = computed(() => game.value?.status === 'active')

const availablePlayers = computed(() => {
  if (!game.value?.players) return gamesStore.players
  const gamePlayerIds = game.value.players.map(p => p.id)
  return gamesStore.players.filter(p => !gamePlayerIds.includes(p.id))
})

const sortedPlayers = computed(() => {
  if (!game.value?.players) return []
  return [...game.value.players].sort((a, b) => b.score - a.score)
})

function startEditScore(player) {
  editingPlayer.value = player.id
  newScore.value = player.score
}

async function saveScore(playerId) {
  try {
    await gamesStore.updatePlayerScore(game.value.id, playerId, newScore.value)
    editingPlayer.value = null
  } catch (err) {
    alert('Failed to update score')
  }
}

async function addPlayer() {
  if (!selectedPlayerId.value) return
  try {
    await gamesStore.addPlayerToGame(game.value.id, selectedPlayerId.value)
    selectedPlayerId.value = ''
    addingPlayer.value = false
  } catch (err) {
    alert('Failed to add player')
  }
}

async function endGame() {
  if (!confirm('Are you sure you want to end this game?')) return
  try {
    await gamesStore.endGame(game.value.id)
  } catch (err) {
    alert('Failed to end game')
  }
}
</script>

<template>
  <div class="game-detail">
    <div v-if="loading" class="loading">Loading game...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    
    <template v-else-if="game">
      <header class="game-header">
        <div class="header-info">
          <router-link to="/games" class="back-link">← Back to Games</router-link>
          <h1>{{ game.name }}</h1>
          <div class="game-meta">
            <span :class="['status-badge', game.status]">{{ game.status }}</span>
            <span>Template: {{ game.templateName || 'Custom' }}</span>
            <span>Base Points: {{ game.basePoints }}</span>
            <span>{{ new Date(game.createdAt).toLocaleString() }}</span>
          </div>
        </div>
        
        <div v-if="authStore.isAdmin && isActive" class="header-actions">
          <button @click="addingPlayer = true" class="btn btn-primary">
            + Add Player
          </button>
          <button @click="endGame" class="btn btn-danger">
            End Game
          </button>
        </div>
      </header>

      <!-- Add Player Modal -->
      <div v-if="addingPlayer" class="modal-overlay" @click.self="addingPlayer = false">
        <div class="modal">
          <h3>Add Player to Game</h3>
          <select v-model="selectedPlayerId">
            <option value="">Select a player...</option>
            <option v-for="player in availablePlayers" :key="player.id" :value="player.id">
              {{ player.name }}
            </option>
          </select>
          <div class="modal-actions">
            <button @click="addingPlayer = false" class="btn btn-secondary">Cancel</button>
            <button @click="addPlayer" class="btn btn-primary" :disabled="!selectedPlayerId">
              Add Player
            </button>
          </div>
        </div>
      </div>

      <!-- Players Table -->
      <section class="players-section">
        <h2>Players & Scores</h2>
        
        <div v-if="sortedPlayers.length === 0" class="empty-state">
          No players in this game yet.
        </div>
        
        <table v-else class="players-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
              <th v-if="authStore.isAdmin && isActive">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(player, index) in sortedPlayers" :key="player.id">
              <td class="rank">
                <span v-if="index === 0" class="medal">🥇</span>
                <span v-else-if="index === 1" class="medal">🥈</span>
                <span v-else-if="index === 2" class="medal">🥉</span>
                <span v-else>{{ index + 1 }}</span>
              </td>
              <td class="player-name">{{ player.name }}</td>
              <td class="score">
                <template v-if="editingPlayer === player.id">
                  <input 
                    type="number" 
                    v-model.number="newScore"
                    class="score-input"
                    @keyup.enter="saveScore(player.id)"
                  />
                </template>
                <template v-else>
                  {{ player.score }}
                </template>
              </td>
              <td v-if="authStore.isAdmin && isActive" class="actions">
                <template v-if="editingPlayer === player.id">
                  <button @click="saveScore(player.id)" class="btn-icon save">✓</button>
                  <button @click="editingPlayer = null" class="btn-icon cancel">✕</button>
                </template>
                <template v-else>
                  <button @click="startEditScore(player)" class="btn-icon edit">✎</button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>

<style scoped>
.game-detail {
  max-width: 800px;
  margin: 0 auto;
}

.loading, .error {
  text-align: center;
  padding: 3rem;
  color: #a0aec0;
}

.back-link {
  color: #4299e1;
  text-decoration: none;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  display: inline-block;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #4a5568;
}

.game-header h1 {
  color: #fff;
  margin: 0.5rem 0;
}

.game-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: #a0aec0;
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

.header-actions {
  display: flex;
  gap: 0.5rem;
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

.btn-danger {
  background: #e53e3e;
  color: #fff;
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
  max-width: 400px;
}

.modal h3 {
  color: #fff;
  margin-bottom: 1rem;
}

.modal select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #4a5568;
  border-radius: 8px;
  background: #1a202c;
  color: #fff;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.players-section h2 {
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

.players-table {
  width: 100%;
  border-collapse: collapse;
  background: #2d3748;
  border-radius: 12px;
  overflow: hidden;
}

.players-table th,
.players-table td {
  padding: 1rem;
  text-align: left;
}

.players-table th {
  background: #1a202c;
  color: #a0aec0;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.players-table td {
  color: #fff;
  border-top: 1px solid #4a5568;
}

.rank {
  width: 60px;
  text-align: center;
}

.medal {
  font-size: 1.25rem;
}

.score {
  font-weight: 600;
  color: #4299e1;
}

.score-input {
  width: 80px;
  padding: 0.25rem 0.5rem;
  border: 2px solid #4299e1;
  border-radius: 4px;
  background: #1a202c;
  color: #fff;
  font-size: 1rem;
}

.actions {
  width: 100px;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.btn-icon.edit {
  color: #4299e1;
}

.btn-icon.save {
  color: #48bb78;
}

.btn-icon.cancel {
  color: #fc8181;
}

.btn-icon:hover {
  background: #4a5568;
}
</style>
