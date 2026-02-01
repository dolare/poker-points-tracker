import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useGamesStore = defineStore('games', () => {
  const games = ref([])
  const currentGame = ref(null)
  const templates = ref([])
  const players = ref([])

  // Templates
  async function fetchTemplates() {
    const response = await api.get('/templates')
    templates.value = response.data
    return response.data
  }

  async function createTemplate(template) {
    const response = await api.post('/templates', template)
    templates.value.push(response.data)
    return response.data
  }

  async function updateTemplate(id, template) {
    const response = await api.put(`/templates/${id}`, template)
    const index = templates.value.findIndex(t => t.id === id)
    if (index !== -1) templates.value[index] = response.data
    return response.data
  }

  async function deleteTemplate(id) {
    await api.delete(`/templates/${id}`)
    templates.value = templates.value.filter(t => t.id !== id)
  }

  // Players
  async function fetchPlayers() {
    const response = await api.get('/players')
    players.value = response.data
    return response.data
  }

  async function createPlayer(playerData) {
    const response = await api.post('/players', playerData)
    players.value.push(response.data)
    return response.data
  }

  async function updatePlayer(id, playerData) {
    const response = await api.put(`/players/${id}`, playerData)
    const index = players.value.findIndex(p => p.id === id)
    if (index !== -1) players.value[index] = response.data
    return response.data
  }

  async function deletePlayer(id) {
    await api.delete(`/players/${id}`)
    players.value = players.value.filter(p => p.id !== id)
  }

  // Games
  async function fetchGames() {
    const response = await api.get('/games')
    games.value = response.data
    return response.data
  }

  async function fetchGame(id) {
    const response = await api.get(`/games/${id}`)
    currentGame.value = response.data
    return response.data
  }

  async function createGame(gameData) {
    const response = await api.post('/games', gameData)
    games.value.unshift(response.data)
    return response.data
  }

  async function addPlayerToGame(gameId, playerId) {
    const response = await api.post(`/games/${gameId}/players`, { playerId })
    if (currentGame.value?.id === gameId) {
      currentGame.value = response.data
    }
    return response.data
  }

  async function updatePlayerScore(gameId, playerId, score) {
    const response = await api.put(`/games/${gameId}/players/${playerId}`, { score })
    if (currentGame.value?.id === gameId) {
      currentGame.value = response.data
    }
    return response.data
  }

  async function endGame(gameId) {
    const response = await api.put(`/games/${gameId}/end`)
    if (currentGame.value?.id === gameId) {
      currentGame.value = response.data
    }
    const index = games.value.findIndex(g => g.id === gameId)
    if (index !== -1) games.value[index] = response.data
    return response.data
  }

  // Leaderboard
  async function fetchLeaderboard() {
    const response = await api.get('/leaderboard')
    return response.data
  }

  return {
    games,
    currentGame,
    templates,
    players,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    fetchPlayers,
    createPlayer,
    updatePlayer,
    deletePlayer,
    fetchGames,
    fetchGame,
    createGame,
    addPlayerToGame,
    updatePlayerScore,
    endGame,
    fetchLeaderboard
  }
})
