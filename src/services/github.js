// GitHub API Service - Uses GitHub as a database
// Data is stored in data/db.json in the repository

const REPO_OWNER = 'dolare'
const REPO_NAME = 'poker-points-tracker'
const DATA_PATH = 'data/db.json'
const GITHUB_API = 'https://api.github.com'

// Get the GitHub token from localStorage (admin sets this)
function getToken() {
  return localStorage.getItem('github_token')
}

export function setToken(token) {
  localStorage.setItem('github_token', token)
}

export function clearToken() {
  localStorage.removeItem('github_token')
}

export function hasToken() {
  return !!getToken()
}

// Read data from GitHub (public read - no token needed for public repos)
export async function readData() {
  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_PATH}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        }
      }
    )
    
    if (!response.ok) {
      if (response.status === 404) {
        // File doesn't exist yet, return default data
        return getDefaultData()
      }
      throw new Error('Failed to read data from GitHub')
    }
    
    const file = await response.json()
    const content = atob(file.content)
    return JSON.parse(content)
  } catch (error) {
    console.error('Error reading data:', error)
    // Return cached data if available
    const cached = localStorage.getItem('poker_data_cache')
    if (cached) {
      return JSON.parse(cached)
    }
    return getDefaultData()
  }
}

// Write data to GitHub (requires admin token)
export async function writeData(data) {
  const token = getToken()
  if (!token) {
    throw new Error('No GitHub token. Admin login required.')
  }

  // First, get the current file SHA (needed for updates)
  let sha = null
  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_PATH}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${token}`
        }
      }
    )
    if (response.ok) {
      const file = await response.json()
      sha = file.sha
    }
  } catch (e) {
    // File might not exist yet
  }

  // Write the file
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))))
  
  const response = await fetch(
    `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_PATH}`,
    {
      method: 'PUT',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Update poker data - ${new Date().toISOString()}`,
        content: content,
        sha: sha
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to write data to GitHub')
  }

  // Cache the data locally
  localStorage.setItem('poker_data_cache', JSON.stringify(data))
  
  return data
}

// Verify token is valid
export async function verifyToken(token) {
  try {
    const response = await fetch(`${GITHUB_API}/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    return response.ok
  } catch {
    return false
  }
}

// Default data structure
function getDefaultData() {
  return {
    admin: {
      // Default admin password is 'admin123' - change this!
      passwordHash: '$2a$10$defaulthashforinitialsetu', 
      email: 'admin@poker.com'
    },
    players: [
      {
        id: 1,
        name: 'Admin',
        email: 'admin@poker.com',
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    ],
    templates: [
      { id: 1, name: "Texas Hold'em", basePoints: 1000, createdAt: new Date().toISOString() },
      { id: 2, name: 'Omaha', basePoints: 1500, createdAt: new Date().toISOString() },
      { id: 3, name: 'Board Game Night', basePoints: 100, createdAt: new Date().toISOString() }
    ],
    games: [],
    nextIds: {
      player: 2,
      template: 4,
      game: 1
    }
  }
}

export default {
  readData,
  writeData,
  setToken,
  clearToken,
  hasToken,
  verifyToken,
  getDefaultData
}
