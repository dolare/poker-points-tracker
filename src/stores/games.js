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

  // Compute scores for all players in a game from its rounds
  function computePlayerScores(game, basePoints) {
    const scores = {}
    // Initialize all game players to 0
    if (game.players) {
      game.players.forEach(p => { scores[p.id] = 0 })
    }
    if (!game.rounds) return scores

    for (const round of game.rounds) {
      const losers = round.playerIds.filter(id => !round.winnerIds.includes(id))
      const lossPerLoser = basePoints * round.multiplier
      const pot = lossPerLoser * losers.length

      for (const id of losers) {
        if (scores[id] === undefined) scores[id] = 0
        scores[id] -= lossPerLoser
      }

      // Weighted split among winners using per-winner multipliers
      const wm = round.winnerMultipliers || {}
      const totalWeight = round.winnerIds.reduce((sum, id) => sum + (wm[id] || 1), 0)
      for (const id of round.winnerIds) {
        if (scores[id] === undefined) scores[id] = 0
        const weight = wm[id] || 1
        scores[id] += pot * (weight / totalWeight)
      }
    }
    return scores
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
      const template = authStore.data.templates.find(t => t.id === game.templateId)
      const basePoints = template?.basePoints || 0
      const scores = computePlayerScores(game, basePoints)

      // Enrich players with computed scores
      const enrichedPlayers = (game.players || []).map(p => ({
        ...p,
        score: scores[p.id] || 0
      }))

      currentGame.value = {
        ...game,
        players: enrichedPlayers,
        templateName: template?.name || 'Custom',
        basePoints
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
      players: [],
      rounds: []
    }

    // Add initial players (no score stored — computed from rounds)
    if (gameData.playerIds && gameData.playerIds.length > 0) {
      for (const playerId of gameData.playerIds) {
        const player = authStore.data.players.find(p => p.id === playerId)
        if (player) {
          newGame.players.push({
            id: player.id,
            name: player.name
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

    game.players.push({
      id: player.id,
      name: player.name
    })

    await saveData()

    const template = authStore.data.templates.find(t => t.id === game.templateId)
    const basePoints = template?.basePoints || 0
    const scores = computePlayerScores(game, basePoints)

    currentGame.value = {
      ...game,
      players: game.players.map(p => ({ ...p, score: scores[p.id] || 0 })),
      templateName: template?.name,
      basePoints
    }

    return currentGame.value
  }

  async function addRound(gameId, multiplier, winnerIds, winnerMultipliers = {}) {
    if (!authStore.data) await authStore.loadData()

    const game = authStore.data.games.find(g => g.id === parseInt(gameId))
    if (!game) throw new Error('Game not found')
    if (game.status !== 'active') throw new Error('Game is not active')
    if (game.players.length < 2) throw new Error('Need at least 2 players')

    const playerIds = game.players.map(p => p.id)
    // Validate all winners are in the game
    for (const wid of winnerIds) {
      if (!playerIds.includes(wid)) throw new Error('Winner not in game')
    }
    // Must have at least 1 loser
    const loserCount = playerIds.length - winnerIds.length
    if (loserCount < 1) throw new Error('Need at least 1 loser')

    if (!game.rounds) game.rounds = []

    const roundNumber = game.rounds.length + 1
    const newRound = {
      id: authStore.data.nextIds.round++,
      roundNumber,
      multiplier,
      playerIds: [...playerIds],
      winnerIds: [...winnerIds],
      winnerMultipliers: { ...winnerMultipliers },
      createdAt: new Date().toISOString()
    }

    game.rounds.push(newRound)
    await saveData()

    // Re-fetch to refresh computed scores
    return fetchGame(gameId)
  }

  async function deleteRound(gameId, roundId) {
    if (!authStore.data) await authStore.loadData()

    const game = authStore.data.games.find(g => g.id === parseInt(gameId))
    if (!game) throw new Error('Game not found')

    game.rounds = (game.rounds || []).filter(r => r.id !== roundId)
    // Renumber remaining rounds
    game.rounds.forEach((r, i) => { r.roundNumber = i + 1 })

    await saveData()
    return fetchGame(gameId)
  }

  async function endGame(gameId) {
    if (!authStore.data) await authStore.loadData()

    const game = authStore.data.games.find(g => g.id === parseInt(gameId))
    if (!game) throw new Error('Game not found')

    game.status = 'ended'
    game.endedAt = new Date().toISOString()

    await saveData()

    return fetchGame(gameId)
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

    // Calculate scores from ended games using rounds
    authStore.data.games
      .filter(game => game.status === 'ended')
      .forEach(game => {
        const template = authStore.data.templates.find(t => t.id === game.templateId)
        const basePoints = template?.basePoints || 0
        const scores = computePlayerScores(game, basePoints)

        game.players.forEach(player => {
          if (playerScores[player.id]) {
            playerScores[player.id].totalPoints += (scores[player.id] || 0)
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
    computePlayerScores,
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
    addRound,
    deleteRound,
    endGame,
    fetchLeaderboard
  }
})
