<script setup>
import { ref, onMounted } from 'vue'
import { useGamesStore } from '../../stores/games'

const gamesStore = useGamesStore()
const loading = ref(true)
const showModal = ref(false)
const editingTemplate = ref(null)

const formData = ref({
  name: '',
  basePoints: 1000
})

onMounted(async () => {
  try {
    await gamesStore.fetchTemplates()
  } finally {
    loading.value = false
  }
})

function openCreateModal() {
  editingTemplate.value = null
  formData.value = { name: '', basePoints: 1000 }
  showModal.value = true
}

function openEditModal(template) {
  editingTemplate.value = template
  formData.value = { name: template.name, basePoints: template.basePoints }
  showModal.value = true
}

async function saveTemplate() {
  try {
    if (editingTemplate.value) {
      await gamesStore.updateTemplate(editingTemplate.value.id, formData.value)
    } else {
      await gamesStore.createTemplate(formData.value)
    }
    showModal.value = false
  } catch (err) {
    alert('Failed to save template')
  }
}

async function deleteTemplate(id) {
  if (!confirm('Are you sure you want to delete this template?')) return
  try {
    await gamesStore.deleteTemplate(id)
  } catch (err) {
    alert('Failed to delete template')
  }
}
</script>

<template>
  <div class="templates-page">
    <header class="page-header">
      <h1>📋 Game Templates</h1>
      <button @click="openCreateModal" class="btn btn-primary">
        + New Template
      </button>
    </header>

    <div v-if="loading" class="loading">Loading templates...</div>
    
    <div v-else-if="gamesStore.templates.length === 0" class="empty-state">
      <p>No templates yet. Create one to get started!</p>
      <button @click="openCreateModal" class="btn btn-primary">Create Template</button>
    </div>
    
    <div v-else class="templates-grid">
      <div v-for="template in gamesStore.templates" :key="template.id" class="template-card">
        <div class="template-info">
          <h3>{{ template.name }}</h3>
          <p class="base-points">Base Points: <strong>{{ template.basePoints }}</strong></p>
        </div>
        <div class="template-actions">
          <button @click="openEditModal(template)" class="btn-icon edit">✎</button>
          <button @click="deleteTemplate(template.id)" class="btn-icon delete">🗑</button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h3>{{ editingTemplate ? 'Edit Template' : 'New Template' }}</h3>
        <form @submit.prevent="saveTemplate">
          <div class="form-group">
            <label for="name">Template Name</label>
            <input
              type="text"
              id="name"
              v-model="formData.name"
              required
              placeholder="e.g., Texas Hold'em"
            />
          </div>
          <div class="form-group">
            <label for="basePoints">Base Points</label>
            <input
              type="number"
              id="basePoints"
              v-model.number="formData.basePoints"
              required
              min="0"
            />
            <small>Starting points for each player in this game type</small>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showModal = false" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              {{ editingTemplate ? 'Save Changes' : 'Create Template' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.templates-page {
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

.templates-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.template-card {
  background: #2d3748;
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-info h3 {
  color: #fff;
  margin: 0 0 0.5rem 0;
}

.base-points {
  color: #a0aec0;
  margin: 0;
}

.base-points strong {
  color: #4299e1;
}

.template-actions {
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
