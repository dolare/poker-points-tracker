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
const addingPlayer = ref(false)
const selectedPlayerId = ref('')

// Add Round modal state
const addingRound = ref(false)
const roundMultiplier = ref(1)
const selectedWinnerIds = ref([])
const winnerMultipliers = ref({}) // { playerId: multiplier }

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

// Reverse-chronological rounds
const sortedRounds = computed(() => {
  if (!game.value?.rounds) return []
  return [...game.value.rounds].reverse()
})

// Add-round preview math
const roundPreview = computed(() => {
  if (!game.value || selectedWinnerIds.value.length === 0) return null

  const basePoints = game.value.basePoints || 0
  const totalPlayers = game.value.players.length
  const loserCount = totalPlayers - selectedWinnerIds.value.length

  if (loserCount < 1) return null

  const lossPerLoser = basePoints * roundMultiplier.value
  const pot = lossPerLoser * loserCount

  // Weighted split
  const totalWeight = selectedWinnerIds.value.reduce(
    (sum, id) => sum + (winnerMultipliers.value[id] || 1), 0
  )
  const perWinner = selectedWinnerIds.value.map(id => {
    const w = winnerMultipliers.value[id] || 1
    const name = getPlayerName(id)
    const gain = pot * (w / totalWeight)
    return { id, name, weight: w, gain }
  })

  return { lossPerLoser, pot, loserCount, perWinner }
})

const canAddRound = computed(() => {
  return game.value?.players?.length >= 2 &&
    selectedWinnerIds.value.length > 0 &&
    selectedWinnerIds.value.length < game.value.players.length &&
    roundMultiplier.value >= 1
})

function toggleWinner(playerId) {
  const idx = selectedWinnerIds.value.indexOf(playerId)
  if (idx === -1) {
    selectedWinnerIds.value.push(playerId)
    winnerMultipliers.value[playerId] = 1
  } else {
    selectedWinnerIds.value.splice(idx, 1)
    delete winnerMultipliers.value[playerId]
  }
}

function setWinnerMultiplier(playerId, val) {
  winnerMultipliers.value[playerId] = Math.max(1, val || 1)
}

function openAddRound() {
  roundMultiplier.value = 1
  selectedWinnerIds.value = []
  winnerMultipliers.value = {}
  addingRound.value = true
}

async function confirmAddRound() {
  if (!canAddRound.value) return
  try {
    await gamesStore.addRound(game.value.id, roundMultiplier.value, selectedWinnerIds.value, winnerMultipliers.value)
    addingRound.value = false
  } catch (err) {
    alert(err.message || 'Failed to add round')
  }
}

async function removeRound(roundId) {
  if (!confirm('Delete this round? Scores will be recalculated.')) return
  try {
    await gamesStore.deleteRound(game.value.id, roundId)
  } catch (err) {
    alert('Failed to delete round')
  }
}

function formatScore(score) {
  if (score === 0) return '0'
  const rounded = Math.round(score * 100) / 100
  return rounded > 0 ? `+${rounded}` : `${rounded}`
}

function scoreClass(score) {
  if (score > 0) return 'score-positive'
  if (score < 0) return 'score-negative'
  return 'score-zero'
}

function getPlayerName(playerId) {
  const p = game.value?.players?.find(pl => pl.id === playerId)
  return p?.name || `Player #${playerId}`
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
          <router-link to="/games" class="back-link">&larr; Back to Games</router-link>
          <h1>{{ game.name }}</h1>
          <div class="game-meta">
            <span :class="['status-badge', game.status]">{{ game.status }}</span>
            <span>Template: {{ game.templateName || 'Custom' }}</span>
            <span>Base Points: {{ game.basePoints }}</span>
            <span>{{ new Date(game.createdAt).toLocaleString() }}</span>
          </div>
        </div>

        <div v-if="authStore.isAdmin && isActive" class="header-actions">
          <button @click="addingPlayer = true" class="btn btn-primary">+ Add Player</button>
          <button @click="openAddRound" class="btn btn-success" :disabled="game.players.length < 2">
            + Add Round
          </button>
          <button @click="endGame" class="btn btn-danger">End Game</button>
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

      <!-- Add Round Modal -->
      <div v-if="addingRound" class="modal-overlay" @click.self="addingRound = false">
        <div class="modal modal-round">
          <h3>Add Round</h3>

          <div class="form-group">
            <label>Multiplier</label>
            <input type="number" v-model.number="roundMultiplier" min="1" class="multiplier-input" />
          </div>

          <div class="form-group">
            <label>Select Winners (click to toggle)</label>
            <div class="player-chips">
              <button
                v-for="player in game.players"
                :key="player.id"
                :class="['chip', { 'chip-winner': selectedWinnerIds.includes(player.id) }]"
                @click="toggleWinner(player.id)"
              >
                {{ player.name }}
              </button>
            </div>
          </div>

          <!-- Per-winner multipliers -->
          <div v-if="selectedWinnerIds.length > 0" class="form-group">
            <label>Winner Multipliers (weight for pot split)</label>
            <div class="winner-multipliers">
              <div v-for="wid in selectedWinnerIds" :key="wid" class="winner-mult-row">
                <span class="winner-mult-name">{{ getPlayerName(wid) }}</span>
                <input
                  type="number"
                  :value="winnerMultipliers[wid] || 1"
                  @input="setWinnerMultiplier(wid, +$event.target.value)"
                  min="1"
                  class="winner-mult-input"
                />
              </div>
            </div>
          </div>

          <!-- Live preview -->
          <div v-if="roundPreview" class="round-preview">
            <div class="preview-title">Preview</div>
            <div class="preview-row preview-loss">
              Each loser ({{ roundPreview.loserCount }}): <strong>-{{ roundPreview.lossPerLoser }}</strong>
            </div>
            <div class="preview-row preview-pot">
              Pot: <strong>{{ roundPreview.pot }}</strong>
            </div>
            <div v-for="pw in roundPreview.perWinner" :key="pw.id" class="preview-row preview-gain">
              {{ pw.name }} (x{{ pw.weight }}): <strong>+{{ Math.round(pw.gain * 100) / 100 }}</strong>
            </div>
          </div>
          <div v-else-if="selectedWinnerIds.length > 0 && selectedWinnerIds.length >= game.players.length" class="preview-error">
            Need at least 1 loser
          </div>

          <div class="modal-actions">
            <button @click="addingRound = false" class="btn btn-secondary">Cancel</button>
            <button @click="confirmAddRound" class="btn btn-success" :disabled="!canAddRound">
              Confirm Round
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
            </tr>
          </thead>
          <tbody>
            <tr v-for="(player, index) in sortedPlayers" :key="player.id">
              <td class="rank">
                <span v-if="index === 0" class="medal">1st</span>
                <span v-else-if="index === 1" class="medal silver">2nd</span>
                <span v-else-if="index === 2" class="medal bronze">3rd</span>
                <span v-else>{{ index + 1 }}</span>
              </td>
              <td class="player-name">{{ player.name }}</td>
              <td :class="['score', scoreClass(player.score)]">
                {{ formatScore(player.score) }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Rounds History -->
      <section class="rounds-section">
        <h2>Rounds ({{ game.rounds?.length || 0 }})</h2>

        <div v-if="!game.rounds || game.rounds.length === 0" class="empty-state">
          No rounds played yet.
        </div>

        <div v-else class="rounds-list">
          <div v-for="round in sortedRounds" :key="round.id" class="round-card">
            <div class="round-header">
              <span class="round-number">Round {{ round.roundNumber }}</span>
              <span class="multiplier-badge">x{{ round.multiplier }}</span>
              <button
                v-if="authStore.isAdmin && isActive"
                @click="removeRound(round.id)"
                class="btn-icon delete"
                title="Delete round"
              >
                &times;
              </button>
            </div>
            <div class="round-details">
              <div class="round-math">
                <span class="math-item loss">
                  Losers: -{{ game.basePoints * round.multiplier }} each
                </span>
              </div>
              <div class="round-winners">
                <span class="detail-label">Winners:</span>
                <span class="winner-name" v-for="wid in round.winnerIds" :key="wid">
                  {{ getPlayerName(wid) }}
                  <template v-if="(round.winnerMultipliers || {})[wid] > 1">(x{{ round.winnerMultipliers[wid] }})</template>:
                  +{{ Math.round(
                    game.basePoints * round.multiplier
                    * (round.playerIds.length - round.winnerIds.length)
                    * ((round.winnerMultipliers || {})[wid] || 1)
                    / round.winnerIds.reduce((s, id) => s + ((round.winnerMultipliers || {})[id] || 1), 0)
                    * 100
                  ) / 100 }}
                </span>
              </div>
            </div>
          </div>
        </div>
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
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.btn-success {
  background: #48bb78;
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

.modal-round {
  max-width: 500px;
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
  margin-top: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  color: #a0aec0;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.multiplier-input {
  width: 80px;
  padding: 0.5rem;
  border: 2px solid #4a5568;
  border-radius: 8px;
  background: #1a202c;
  color: #fff;
  font-size: 1.25rem;
  text-align: center;
}

.player-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 2px solid #4a5568;
  background: #1a202c;
  color: #a0aec0;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.15s;
}

.chip:hover {
  border-color: #48bb78;
}

.chip-winner {
  background: #48bb78;
  color: #fff;
  border-color: #48bb78;
}

.winner-multipliers {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.winner-mult-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.winner-mult-name {
  color: #68d391;
  font-size: 0.875rem;
  min-width: 100px;
}

.winner-mult-input {
  width: 60px;
  padding: 0.35rem 0.5rem;
  border: 2px solid #4a5568;
  border-radius: 6px;
  background: #1a202c;
  color: #fff;
  font-size: 1rem;
  text-align: center;
}

.round-preview {
  background: #1a202c;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 0.5rem;
}

.preview-title {
  color: #a0aec0;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.preview-row {
  color: #fff;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.preview-loss {
  color: #fc8181;
}

.preview-pot {
  color: #fbd38d;
}

.preview-gain {
  color: #68d391;
}

.preview-error {
  color: #fc8181;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.players-section h2,
.rounds-section h2 {
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
  font-size: 0.875rem;
  font-weight: 700;
  color: #fbd38d;
}

.medal.silver {
  color: #a0aec0;
}

.medal.bronze {
  color: #c69c6d;
}

.score {
  font-weight: 600;
}

.score-positive {
  color: #68d391;
}

.score-negative {
  color: #fc8181;
}

.score-zero {
  color: #a0aec0;
}

.rounds-section {
  margin-top: 2rem;
}

.rounds-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.round-card {
  background: #2d3748;
  border-radius: 12px;
  padding: 1rem 1.25rem;
}

.round-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.round-number {
  color: #fff;
  font-weight: 600;
}

.multiplier-badge {
  background: #4299e1;
  color: #fff;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-left: auto;
}

.btn-icon.delete {
  color: #fc8181;
}

.btn-icon:hover {
  background: #4a5568;
}

.round-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 2rem;
  font-size: 0.875rem;
}

.round-winners {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.detail-label {
  color: #a0aec0;
}

.winner-name {
  background: #2f855a;
  color: #fff;
  padding: 0.125rem 0.5rem;
  border-radius: 8px;
  font-size: 0.8rem;
}

.round-math {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.math-item {
  font-size: 0.8rem;
}

.math-item.loss {
  color: #fc8181;
}

.math-item.gain {
  color: #68d391;
}
</style>
