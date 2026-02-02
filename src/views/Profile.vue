<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import ThemeSelector from '../components/ThemeSelector.vue'

const authStore = useAuthStore()

const name = ref(authStore.user?.name || '')
const message = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  message.value = ''
  loading.value = true
  
  try {
    await authStore.updateProfile(name.value)
    message.value = 'Profile updated successfully!'
  } catch (err) {
    error.value = err.message || 'Failed to update profile'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="profile-container">
    <div class="profile-card">
      <h2>Your Profile</h2>
      
      <form @submit.prevent="handleSubmit" class="profile-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            :value="authStore.user?.email"
            disabled
            class="disabled"
          />
          <small class="help-text">Email cannot be changed</small>
        </div>
        
        <div class="form-group">
          <label for="name">Display Name</label>
          <input
            type="text"
            id="name"
            v-model="name"
            required
            placeholder="Your display name"
          />
          <small class="help-text">This name appears on leaderboards and in games</small>
        </div>
        
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="message" class="success-message">{{ message }}</div>
        
        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? 'Saving...' : 'Save Changes' }}
        </button>
      </form>
      
      <div class="profile-stats">
        <h3>Account Info</h3>
        <div class="stat-row">
          <span>Role:</span>
          <span class="stat-value">{{ authStore.user?.role || 'player' }}</span>
        </div>
        <div class="stat-row">
          <span>Member since:</span>
          <span class="stat-value">
            {{ authStore.user?.createdAt ? new Date(authStore.user.createdAt).toLocaleDateString() : '-' }}
          </span>
        </div>
      </div>

      <!-- Theme Selector -->
      <ThemeSelector />
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  display: flex;
  justify-content: center;
}

.profile-card {
  background: var(--color-surface);
  padding: 2.5rem;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
}

.profile-card h2 {
  color: var(--color-text);
  margin-bottom: 2rem;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: var(--color-text);
  font-weight: 500;
}

.form-group input {
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-surface-light);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-group input.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.help-text {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.error-message {
  background: var(--color-error);
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
}

.success-message {
  background: var(--color-success);
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
}

.btn-submit {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  color: white;
  padding: 0.875rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.profile-stats {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-surface-light);
}

.profile-stats h3 {
  color: var(--color-text-secondary);
  font-size: 1rem;
  margin-bottom: 1rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  color: var(--color-text-secondary);
}

.stat-value {
  color: var(--color-text);
  text-transform: capitalize;
}
</style>
