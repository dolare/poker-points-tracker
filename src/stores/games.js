import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

export const useGamesStore = defineStore('games', () => {
  const authStore = useAuthStore()
  
  const currentGame = ref(null)

  // Computed properties that read from auth store's data
  const games = computed(() => authStore.data?.games || [])
  const templates = computed(() => authStore.data?.templates || [])
  const players = computed(() => authStore.data?.players || [])

  // Helper to save data after modifications
  async function saveData() {
    await authStore.saveData()
  }

  // Templates
  async function fetchTemplates() {
    await authStore.loadData()
    return templates.value
  }

  async function createTemplate(template) {
    if (!authStore.data) await authStore.loadData()
    
    const newTemplate = {
      id: authStore.data.nextIds.template++,
      name: template.name,
      basePoints: template.basePoints,
      createdAt: new Date().toISOString()
    }
    
    authStore.data.templates.push(newTemplate)
    await saveData()
    return newTemplate
  }

  async function updateTemplate(id, template) {
    if (!authStore.data) await authStore.loadData()
    
    const index = authStore.data.templates.findIndex(t => t.id === id)
    if (index !== -1) {
      authStore.data.templates[index] = { 
        ...authStore.data.templates[index], 
        ...template 
      }
      await saveData()
      return authStore.data.templates[index]
    }
  }

  async function deleteTemplate(id) {
    if (!authStore.data) await authStore.loadData()
    
    authStore.data.templates = authStore.data.templates.filter(t => t.id !== id)
    await saveData()
  }

  // Players
  async function fetchPlayers() {
    await authStore.loadData()
    return players.value
  }

  async function createPlayer(playerData) {
    if (!authStore.data) await authStore.loadData()
    
    // Check if email exists
    if (authStore.data.players.some(p => p.email === playerData.email)) {
      throw new Error('Email already registered')
    }
    
    const newPlayer = {
      id: authStore.data.nextIds.player++,
      name: playerData.name,
      email: playerData.email,
      role: 'player',
      createdAt: new Date().toISOString()
    }
    
    // Store password for player (simple approach)
    if (playerData.password) {
      newPlayer.password = playerData.password
    }
    
    authStore.data.players.push(newPlayer)
    await saveData()
    return newPlayer
  }

  async function updatePlayer(id, playerData) {
    if (!authStore.data) await authStore.loadData()
    
    const index = authStore.data.players.findIndex(p => p.id === id)
    if (index !== -1) {
      if (playerData.name) {
        authStore.data.players[index].name = playerData.name
      }
      if (playerData.password) {
        authStore.data.players[index].password = playerData.password
      }
      await saveData()
      return authStore.data.players[index]
    }
  }

  async function deletePlayer(id) {
    if (!authStore.data) await authStore.loadData()
    
    const player = authStore.data.players.find(p => p.id === id)
    if (player?.role === 'admin') {
      throw new Error('Cannot delete admin')
    }
    
    // Remove from games
    authStore.data.games.forEach(game => {
      game.players = game.players?.filter(p => p.id !== id) || []
    })
    
    authStore.data.players = authStore.data.players.filter(p => p.id !== id)
    await saveData()
  }

  // Games
  async function fetchGames() {
    await authStore.loadData()
    return games.value
  }

  async function fetchGame(id) {
    await authStore.loadData()
    
    const game = authStore.data.games.find(g => g.id === parseInt(id))
    if (game) {
      // Enrich with template info
      const template = authStore.data.templates.find(t => t.id === game.templateId)
      currentGame.value = {
        ...game,
        templateName: template?.name || 'Custom',
        basePoints: template?.basePoints || 0
      }
    }
    return currentGame.value
  }

  async function createGame(gameData) {
    if (!authStore.data) await authStore.loadData()
    
    const template = authStore.data.templates.find(t => t.id === gameData.templateId)
    
    const newGame = {
      id: authStore.data.nextIds.game++,
      name: gameData.name,
      templateId: gameData.templateId,
      status: 'active',
      createdAt: new Date().toISOString(),
      players: []
    }
    
    // Add initial players with base points
    if (gameData.playerIds && gameData.playerIds.length > 0) {
      for (const playerId of gameData.playerIds) {
        const player = authStore.data.players.find(p => p.id === playerId)
        if (player) {
          newGame.players.push({
            id: player.id,
            name: player.name,
            score: template?.basePoints || 0
          })
        }
      }
    }
    
    authStore.data.games.unshift(newGame)
    await saveData()
    
    return {
      ...newGame,
      templateName: template?.name,
      basePoints: template?.basePoints,
      playerCount: newGame.players.length
    }
  }

  async function addPlayerToGame(gameId, playerId) {
    if (!authStore.data) await authStore.loadData()
    
    const gameIndex = authStore.data.games.findIndex(g => g.id === parseInt(gameId))
    if (gameIndex === -1) throw new Error('Game not found')
    
    const game = authStore.data.games[gameIndex]
    if (game.status !== 'active') throw new Error('Game is not active')
    
    const player = authStore.data.players.find(p => p.id === parseInt(playerId))
    if (!player) throw new Error('Player not found')
    
    if (game.players.some(p => p.id === player.id)) {
      throw new Error('Player already in game')
    }
    
    const template = authStore.data.templates.find(t => t.id === game.templateId)
    
    game.players.push({
      id: player.id,
      name: player.name,
      score: template?.basePoints || 0
    })
    
    await saveData()
    
    currentGame.value = {
      ...game,
      templateName: template?.name,
      basePoints: template?.basePoints
    }
    
    return currentGame.value
  }

  async function updatePlayerScore(gameId, playerId, score) {
    if (!authStore.data) await authStore.loadData()
    
    const game = authStore.data.games.find(g => g.id === parseInt(gameId))
    if (!game) throw new Error('Game not found')
    
    const playerInGame = game.players.find(p => p.id === parseInt(playerId))
    if (!playerInGame) throw new Error('Player not in game')
    
    playerInGame.score = score
    
    await saveData()
    
    const template = authStore.data.templates.find(t => t.id === game.templateId)
    currentGame.value = {
      ...game,
      templateName: template?.name,
      basePoints: template?.basePoints
    }
    
    return currentGame.value
  }

  async function endGame(gameId) {
    if (!authStore.data) await authStore.loadData()
    
    const game = authStore.data.games.find(g => g.id === parseInt(gameId))
    if (!game) throw new Error('Game not found')
    
    game.status = 'ended'
    game.endedAt = new Date().toISOString()
    
    await saveData()
    
    const template = authStore.data.templates.find(t => t.id === game.templateId)
    currentGame.value = {
      ...game,
      templateName: template?.name,
      basePoints: template?.basePoints
    }
    
    return currentGame.value
  }

  // Leaderboard
  async function fetchLeaderboard() {
    await authStore.loadData()
    
    const playerScores = {}
    
    // Initialize all players
    authStore.data.players.forEach(player => {
      playerScores[player.id] = {
        id: player.id,
        name: player.name,
        totalPoints: 0,
        gamesPlayed: 0
      }
    })
    
    // Calculate scores from ended games
    authStore.data.games
      .filter(game => game.status === 'ended')
      .forEach(game => {
        game.players.forEach(player => {
          if (playerScores[player.id]) {
            playerScores[player.id].totalPoints += player.score
            playerScores[player.id].gamesPlayed++
          }
        })
      })
    
    // Sort by total points and add rank
    const leaderboard = Object.values(playerScores)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }))
    
    return leaderboard
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
