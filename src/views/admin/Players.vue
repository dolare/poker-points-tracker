<script setup>
import { ref, onMounted } from 'vue'
import { useGamesStore } from '../../stores/games'

const gamesStore = useGamesStore()
const loading = ref(true)
const showModal = ref(false)
const editingPlayer = ref(null)

const formData = ref({
  name: '',
  email: '',
  password: ''
})

onMounted(async () => {
  try {
    await gamesStore.fetchPlayers()
  } finally {
    loading.value = false
  }
})

function openCreateModal() {
  editingPlayer.value = null
  formData.value = { name: '', email: '', password: '' }
  showModal.value = true
}

function openEditModal(player) {
  editingPlayer.value = player
  formData.value = { name: player.name, email: player.email, password: '' }
  showModal.value = true
}

async function savePlayer() {
  try {
    if (editingPlayer.value) {
      // Update existing player
      const updateData = { name: formData.value.name }
      if (formData.value.password) {
        updateData.password = formData.value.password
      }
      await gamesStore.updatePlayer(editingPlayer.value.id, updateData)
    } else {
      // Create new player
      if (!formData.value.password) {
        alert('Password is required for new players')
        return
      }
      await gamesStore.createPlayer(formData.value)
    }
    showModal.value = false
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to save player')
  }
}

async function deletePlayer(player) {
  if (player.role === 'admin') {
    alert('Cannot delete admin users')
    return
  }
  if (!confirm(`Are you sure you want to delete ${player.name}? This will also remove them from all games.`)) return
  try {
    await gamesStore.deletePlayer(player.id)
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to delete player')
  }
}
</script>

<template>
  <div class="players-page">
    <header class="page-header">
      <h1>👥 Manage Players</h1>
      <button @click="openCreateModal" class="btn btn-primary">
        + Add Player
      </button>
    </header>

    <div v-if="loading" class="loading">Loading players...</div>
    
    <div v-else-if="gamesStore.players.length === 0" class="empty-state">
      <p>No players yet. Add one to get started!</p>
      <button @click="openCreateModal" class="btn btn-primary">Add Player</button>
    </div>
    
    <div v-else class="players-list">
      <table class="players-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="player in gamesStore.players" :key="player.id">
            <td class="player-name">{{ player.name }}</td>
            <td>{{ player.email }}</td>
            <td>
              <span :class="['role-badge', player.role]">{{ player.role }}</span>
            </td>
            <td>{{ new Date(player.createdAt).toLocaleDateString() }}</td>
            <td class="actions">
              <button @click="openEditModal(player)" class="btn-icon edit">✎</button>
              <button 
                v-if="player.role !== 'admin'" 
                @click="deletePlayer(player)" 
                class="btn-icon delete"
              >🗑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h3>{{ editingPlayer ? 'Edit Player' : 'Add New Player' }}</h3>
        <form @submit.prevent="savePlayer">
          <div class="form-group">
            <label for="name">Name</label>
            <input
              type="text"
              id="name"
              v-model="formData.name"
              required
              placeholder="Player name"
            />
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              v-model="formData.email"
              :disabled="!!editingPlayer"
              required
              placeholder="player@email.com"
            />
            <small v-if="editingPlayer">Email cannot be changed</small>
          </div>
          <div class="form-group">
            <label for="password">
              {{ editingPlayer ? 'New Password (leave blank to keep current)' : 'Password' }}
            </label>
            <input
              type="password"
              id="password"
              v-model="formData.password"
              :required="!editingPlayer"
              placeholder="••••••••"
            />
          </div>
          <div class="modal-actions">
            <button type="button" @click="showModal = false" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              {{ editingPlayer ? 'Save Changes' : 'Add Player' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.players-page {
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

.loading, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #a0aec0;
  background: #2d3748;
  border-radius: 12px;
}

.empty-state .btn {
  margin-top: 1rem;
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
  color: #e2e8f0;
  border-top: 1px solid #4a5568;
}

.player-name {
  font-weight: 500;
}

.role-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
}

.role-badge.admin {
  background: #f6ad55;
  color: #1a202c;
}

.role-badge.player {
  background: #4a5568;
  color: #e2e8f0;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: #4a5568;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-icon.edit:hover {
  background: #4299e1;
}

.btn-icon.delete:hover {
  background: #e53e3e;
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

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #4a5568;
  border-radius: 8px;
  background: #1a202c;
  color: #fff;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #4299e1;
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-group small {
  color: #718096;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
</style>
