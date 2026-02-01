<script setup>
import { ref, onMounted } from 'vue'
import { useGamesStore } from '../stores/games'

const gamesStore = useGamesStore()
const leaderboard = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    leaderboard.value = await gamesStore.fetchLeaderboard()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="leaderboard-page">
    <header class="page-header">
      <h1>🏆 Leaderboard</h1>
      <p>All-time player rankings</p>
    </header>

    <div v-if="loading" class="loading">Loading leaderboard...</div>
    
    <div v-else-if="leaderboard.length === 0" class="empty-state">
      <p>No players on the leaderboard yet. Start playing games!</p>
    </div>
    
    <div v-else class="leaderboard-container">
      <!-- Top 3 Podium -->
      <div class="podium" v-if="leaderboard.length >= 3">
        <div class="podium-place second">
          <div class="podium-avatar">🥈</div>
          <div class="podium-name">{{ leaderboard[1]?.name }}</div>
          <div class="podium-points">{{ leaderboard[1]?.totalPoints }} pts</div>
          <div class="podium-stand">2</div>
        </div>
        <div class="podium-place first">
          <div class="podium-avatar">🥇</div>
          <div class="podium-name">{{ leaderboard[0]?.name }}</div>
          <div class="podium-points">{{ leaderboard[0]?.totalPoints }} pts</div>
          <div class="podium-stand">1</div>
        </div>
        <div class="podium-place third">
          <div class="podium-avatar">🥉</div>
          <div class="podium-name">{{ leaderboard[2]?.name }}</div>
          <div class="podium-points">{{ leaderboard[2]?.totalPoints }} pts</div>
          <div class="podium-stand">3</div>
        </div>
      </div>

      <!-- Full Rankings Table -->
      <table class="rankings-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Games Played</th>
            <th>Total Points</th>
            <th>Avg Points</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(player, index) in leaderboard" :key="player.id" :class="{ 'top-three': index < 3 }">
            <td class="rank">
              <span v-if="index === 0">🥇</span>
              <span v-else-if="index === 1">🥈</span>
              <span v-else-if="index === 2">🥉</span>
              <span v-else>{{ index + 1 }}</span>
            </td>
            <td class="player-name">{{ player.name }}</td>
            <td>{{ player.gamesPlayed }}</td>
            <td class="points">{{ player.totalPoints }}</td>
            <td>{{ player.gamesPlayed > 0 ? Math.round(player.totalPoints / player.gamesPlayed) : 0 }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.leaderboard-page {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-header h1 {
  color: #fff;
  font-size: 2.5rem;
}

.page-header p {
  color: #a0aec0;
}

.loading, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #a0aec0;
  background: #2d3748;
  border-radius: 12px;
}

.podium {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 3rem;
  padding: 2rem 0;
}

.podium-place {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #2d3748;
  padding: 1.5rem;
  border-radius: 12px;
  min-width: 150px;
}

.podium-place.first {
  transform: translateY(-20px);
  background: linear-gradient(135deg, #f6e05e 0%, #d69e2e 100%);
}

.podium-place.first .podium-name,
.podium-place.first .podium-points {
  color: #1a202c;
}

.podium-place.second {
  background: linear-gradient(135deg, #a0aec0 0%, #718096 100%);
}

.podium-place.second .podium-name,
.podium-place.second .podium-points {
  color: #1a202c;
}

.podium-place.third {
  background: linear-gradient(135deg, #ed8936 0%, #c05621 100%);
}

.podium-place.third .podium-name,
.podium-place.third .podium-points {
  color: #1a202c;
}

.podium-avatar {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.podium-name {
  color: #fff;
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.podium-points {
  color: #a0aec0;
  font-size: 0.9rem;
}

.podium-stand {
  margin-top: 1rem;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #1a202c;
}

.rankings-table {
  width: 100%;
  border-collapse: collapse;
  background: #2d3748;
  border-radius: 12px;
  overflow: hidden;
}

.rankings-table th,
.rankings-table td {
  padding: 1rem;
  text-align: left;
}

.rankings-table th {
  background: #1a202c;
  color: #a0aec0;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.rankings-table td {
  color: #e2e8f0;
  border-top: 1px solid #4a5568;
}

.rankings-table tr.top-three {
  background: rgba(66, 153, 225, 0.1);
}

.rank {
  width: 60px;
  text-align: center;
  font-size: 1.25rem;
}

.player-name {
  font-weight: 500;
}

.points {
  font-weight: 600;
  color: #4299e1;
}
</style>
