<script setup>
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div class="home">
    <section class="hero">
      <h1>🎴 Poker Points Tracker</h1>
      <p class="subtitle">Track scores and points across all your poker and board game sessions</p>
      
      <div class="cta-buttons" v-if="!authStore.isAuthenticated">
        <router-link to="/login" class="btn btn-primary">Sign In</router-link>
        <router-link to="/leaderboard" class="btn btn-secondary">View Leaderboard</router-link>
      </div>
      <div class="cta-buttons" v-else>
        <router-link to="/dashboard" class="btn btn-primary">Go to Dashboard</router-link>
        <router-link to="/leaderboard" class="btn btn-secondary">View Leaderboard</router-link>
      </div>
    </section>

    <section class="features">
      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <h3>Track Points Forever</h3>
        <p>All player scores are stored permanently. View historical data and track progress over time.</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🎮</div>
        <h3>Game Templates</h3>
        <p>Create templates for different game types with preset base points and rules.</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">👥</div>
        <h3>Player Management</h3>
        <p>Register players, track their scores, and see who's leading on the leaderboard.</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🏆</div>
        <h3>Leaderboard</h3>
        <p>See cumulative rankings across all games and celebrate your champions.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  text-align: center;
}

.hero {
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-radius: 16px;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #fff;
}

.subtitle {
  font-size: 1.25rem;
  color: #a0aec0;
  margin-bottom: 2rem;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn {
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn:hover {
  transform: translateY(-2px);
}

.btn-primary {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: #fff;
}

.btn-secondary {
  background: transparent;
  border: 2px solid #4299e1;
  color: #4299e1;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  padding: 2rem 0;
}

.feature-card {
  background: #2d3748;
  padding: 2rem;
  border-radius: 12px;
  transition: transform 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  color: #fff;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: #a0aec0;
  line-height: 1.6;
}
</style>
