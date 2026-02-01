import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3001
const JWT_SECRET = process.env.JWT_SECRET || 'poker-points-secret-key-change-in-production'

// Database setup
const db = new Database(join(__dirname, 'poker.db'))
db.pragma('journal_mode = WAL')

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'player',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    basePoints INTEGER NOT NULL DEFAULT 1000,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    templateId INTEGER,
    status TEXT DEFAULT 'active',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    endedAt TEXT,
    FOREIGN KEY (templateId) REFERENCES templates(id)
  );

  CREATE TABLE IF NOT EXISTS game_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gameId INTEGER NOT NULL,
    playerId INTEGER NOT NULL,
    score INTEGER DEFAULT 0,
    FOREIGN KEY (gameId) REFERENCES games(id),
    FOREIGN KEY (playerId) REFERENCES users(id),
    UNIQUE(gameId, playerId)
  );
`)

// Create default admin user if none exists
const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin')
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10)
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Admin',
    'admin@poker.com',
    hashedPassword,
    'admin'
  )
  console.log('Default admin created: admin@poker.com / admin123')
}

// Create default templates if none exist
const templatesExist = db.prepare('SELECT id FROM templates').get()
if (!templatesExist) {
  db.prepare('INSERT INTO templates (name, basePoints) VALUES (?, ?)').run('Texas Hold\'em', 1000)
  db.prepare('INSERT INTO templates (name, basePoints) VALUES (?, ?)').run('Omaha', 1500)
  db.prepare('INSERT INTO templates (name, basePoints) VALUES (?, ?)').run('Board Game Night', 100)
  console.log('Default templates created')
}

// Middleware
app.use(cors())
app.use(express.json())

// Auth middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}

// Auth routes
// Public registration is DISABLED - only admins can add players
app.post('/api/auth/register', (req, res) => {
  return res.status(403).json({ message: 'Public registration is disabled. Contact admin to create an account.' })
})

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const validPassword = bcrypt.compareSync(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    const { password: _, ...userWithoutPassword } = user

    res.json({ token, user: userWithoutPassword })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Login failed' })
  }
})

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, createdAt FROM users WHERE id = ?').get(req.user.id)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }
  res.json(user)
})

app.put('/api/auth/profile', authenticate, (req, res) => {
  const { name } = req.body
  if (!name) {
    return res.status(400).json({ message: 'Name is required' })
  }

  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user.id)
  const user = db.prepare('SELECT id, name, email, role, createdAt FROM users WHERE id = ?').get(req.user.id)
  res.json(user)
})

// Templates routes
app.get('/api/templates', authenticate, (req, res) => {
  const templates = db.prepare('SELECT * FROM templates ORDER BY name').all()
  res.json(templates)
})

app.post('/api/templates', authenticate, requireAdmin, (req, res) => {
  const { name, basePoints } = req.body
  if (!name || basePoints === undefined) {
    return res.status(400).json({ message: 'Name and base points are required' })
  }

  const result = db.prepare('INSERT INTO templates (name, basePoints) VALUES (?, ?)').run(name, basePoints)
  const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(result.lastInsertRowid)
  res.json(template)
})

app.put('/api/templates/:id', authenticate, requireAdmin, (req, res) => {
  const { name, basePoints } = req.body
  db.prepare('UPDATE templates SET name = ?, basePoints = ? WHERE id = ?').run(name, basePoints, req.params.id)
  const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id)
  res.json(template)
})

app.delete('/api/templates/:id', authenticate, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// Players routes
app.get('/api/players', authenticate, (req, res) => {
  const players = db.prepare('SELECT id, name, email, role, createdAt FROM users ORDER BY name').all()
  res.json(players)
})

// Admin: Create new player
app.post('/api/players', authenticate, requireAdmin, (req, res) => {
  try {
    const { name, email, password } = req.body
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const hashedPassword = bcrypt.hashSync(password, 10)
    const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
      name,
      email,
      hashedPassword,
      'player'
    )

    const player = db.prepare('SELECT id, name, email, role, createdAt FROM users WHERE id = ?').get(result.lastInsertRowid)
    res.json(player)
  } catch (error) {
    console.error('Create player error:', error)
    res.status(500).json({ message: 'Failed to create player' })
  }
})

// Admin: Update player
app.put('/api/players/:id', authenticate, requireAdmin, (req, res) => {
  const { name, password } = req.body
  const playerId = req.params.id

  // Don't allow editing other admins
  const player = db.prepare('SELECT * FROM users WHERE id = ?').get(playerId)
  if (!player) {
    return res.status(404).json({ message: 'Player not found' })
  }

  if (name) {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, playerId)
  }
  
  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10)
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, playerId)
  }

  const updatedPlayer = db.prepare('SELECT id, name, email, role, createdAt FROM users WHERE id = ?').get(playerId)
  res.json(updatedPlayer)
})

// Admin: Delete player
app.delete('/api/players/:id', authenticate, requireAdmin, (req, res) => {
  const playerId = req.params.id
  
  const player = db.prepare('SELECT * FROM users WHERE id = ?').get(playerId)
  if (!player) {
    return res.status(404).json({ message: 'Player not found' })
  }
  
  // Don't allow deleting admins
  if (player.role === 'admin') {
    return res.status(403).json({ message: 'Cannot delete admin users' })
  }

  // Delete player from games first
  db.prepare('DELETE FROM game_players WHERE playerId = ?').run(playerId)
  db.prepare('DELETE FROM users WHERE id = ?').run(playerId)
  
  res.json({ success: true })
})

// Games routes
app.get('/api/games', authenticate, (req, res) => {
  const games = db.prepare(`
    SELECT 
      g.*,
      t.name as templateName,
      t.basePoints,
      (SELECT COUNT(*) FROM game_players WHERE gameId = g.id) as playerCount
    FROM games g
    LEFT JOIN templates t ON g.templateId = t.id
    ORDER BY g.createdAt DESC
  `).all()
  res.json(games)
})

app.get('/api/games/:id', authenticate, (req, res) => {
  const game = db.prepare(`
    SELECT 
      g.*,
      t.name as templateName,
      t.basePoints
    FROM games g
    LEFT JOIN templates t ON g.templateId = t.id
    WHERE g.id = ?
  `).get(req.params.id)

  if (!game) {
    return res.status(404).json({ message: 'Game not found' })
  }

  const players = db.prepare(`
    SELECT 
      gp.playerId as id,
      u.name,
      gp.score
    FROM game_players gp
    JOIN users u ON gp.playerId = u.id
    WHERE gp.gameId = ?
    ORDER BY gp.score DESC
  `).all(req.params.id)

  res.json({ ...game, players })
})

app.post('/api/games', authenticate, requireAdmin, (req, res) => {
  const { name, templateId, playerIds } = req.body

  if (!name || !templateId) {
    return res.status(400).json({ message: 'Name and template are required' })
  }

  const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId)
  if (!template) {
    return res.status(400).json({ message: 'Template not found' })
  }

  const result = db.prepare('INSERT INTO games (name, templateId) VALUES (?, ?)').run(name, templateId)
  const gameId = result.lastInsertRowid

  // Add initial players with base points
  if (playerIds && playerIds.length > 0) {
    const insertPlayer = db.prepare('INSERT INTO game_players (gameId, playerId, score) VALUES (?, ?, ?)')
    for (const playerId of playerIds) {
      insertPlayer.run(gameId, playerId, template.basePoints)
    }
  }

  const game = db.prepare(`
    SELECT 
      g.*,
      t.name as templateName,
      t.basePoints,
      (SELECT COUNT(*) FROM game_players WHERE gameId = g.id) as playerCount
    FROM games g
    LEFT JOIN templates t ON g.templateId = t.id
    WHERE g.id = ?
  `).get(gameId)

  res.json(game)
})

app.post('/api/games/:id/players', authenticate, requireAdmin, (req, res) => {
  const { playerId } = req.body
  const gameId = req.params.id

  const game = db.prepare(`
    SELECT g.*, t.basePoints 
    FROM games g 
    LEFT JOIN templates t ON g.templateId = t.id 
    WHERE g.id = ?
  `).get(gameId)

  if (!game) {
    return res.status(404).json({ message: 'Game not found' })
  }

  if (game.status !== 'active') {
    return res.status(400).json({ message: 'Cannot add players to ended game' })
  }

  // Check if player already in game
  const existing = db.prepare('SELECT id FROM game_players WHERE gameId = ? AND playerId = ?').get(gameId, playerId)
  if (existing) {
    return res.status(400).json({ message: 'Player already in game' })
  }

  db.prepare('INSERT INTO game_players (gameId, playerId, score) VALUES (?, ?, ?)').run(
    gameId,
    playerId,
    game.basePoints
  )

  // Return updated game
  const updatedGame = db.prepare(`
    SELECT 
      g.*,
      t.name as templateName,
      t.basePoints
    FROM games g
    LEFT JOIN templates t ON g.templateId = t.id
    WHERE g.id = ?
  `).get(gameId)

  const players = db.prepare(`
    SELECT 
      gp.playerId as id,
      u.name,
      gp.score
    FROM game_players gp
    JOIN users u ON gp.playerId = u.id
    WHERE gp.gameId = ?
    ORDER BY gp.score DESC
  `).all(gameId)

  res.json({ ...updatedGame, players })
})

app.put('/api/games/:id/players/:playerId', authenticate, requireAdmin, (req, res) => {
  const { score } = req.body
  const { id: gameId, playerId } = req.params

  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId)
  if (!game) {
    return res.status(404).json({ message: 'Game not found' })
  }

  if (game.status !== 'active') {
    return res.status(400).json({ message: 'Cannot update scores in ended game' })
  }

  db.prepare('UPDATE game_players SET score = ? WHERE gameId = ? AND playerId = ?').run(score, gameId, playerId)

  // Return updated game
  const updatedGame = db.prepare(`
    SELECT 
      g.*,
      t.name as templateName,
      t.basePoints
    FROM games g
    LEFT JOIN templates t ON g.templateId = t.id
    WHERE g.id = ?
  `).get(gameId)

  const players = db.prepare(`
    SELECT 
      gp.playerId as id,
      u.name,
      gp.score
    FROM game_players gp
    JOIN users u ON gp.playerId = u.id
    WHERE gp.gameId = ?
    ORDER BY gp.score DESC
  `).all(gameId)

  res.json({ ...updatedGame, players })
})

app.put('/api/games/:id/end', authenticate, requireAdmin, (req, res) => {
  const gameId = req.params.id

  db.prepare('UPDATE games SET status = ?, endedAt = CURRENT_TIMESTAMP WHERE id = ?').run('ended', gameId)

  const game = db.prepare(`
    SELECT 
      g.*,
      t.name as templateName,
      t.basePoints
    FROM games g
    LEFT JOIN templates t ON g.templateId = t.id
    WHERE g.id = ?
  `).get(gameId)

  const players = db.prepare(`
    SELECT 
      gp.playerId as id,
      u.name,
      gp.score
    FROM game_players gp
    JOIN users u ON gp.playerId = u.id
    WHERE gp.gameId = ?
    ORDER BY gp.score DESC
  `).all(gameId)

  res.json({ ...game, players })
})

// Leaderboard route
app.get('/api/leaderboard', (req, res) => {
  const leaderboard = db.prepare(`
    SELECT 
      u.id,
      u.name,
      COALESCE(SUM(gp.score), 0) as totalPoints,
      COUNT(DISTINCT gp.gameId) as gamesPlayed
    FROM users u
    LEFT JOIN game_players gp ON u.id = gp.playerId
    LEFT JOIN games g ON gp.gameId = g.id AND g.status = 'ended'
    GROUP BY u.id
    ORDER BY totalPoints DESC
  `).all()

  // Add rank
  const rankedLeaderboard = leaderboard.map((player, index) => ({
    ...player,
    rank: index + 1
  }))

  res.json(rankedLeaderboard)
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
