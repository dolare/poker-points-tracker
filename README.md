# Poker Points Tracker

A Vue 3 application for tracking poker and board game scores across multiple players and sessions.

## Features

- **Player Management**: Players can register, login, and update their display names
- **Permanent Score Storage**: All scores stored in SQLite database
- **Game Templates**: Create reusable templates with preset base points
- **Game Sessions**: Admins can start games, add players, and track scores
- **Leaderboard**: View all-time rankings across all completed games
- **Admin Controls**: Full game management capabilities for admins

## Tech Stack

- **Frontend**: Vue 3 + Vite + Vue Router + Pinia
- **Backend**: Express.js + SQLite (better-sqlite3)
- **Auth**: JWT-based authentication

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Install dependencies:

```bash
npm install --registry https://registry.npmjs.org
```

2. Start both frontend and backend:

```bash
npm run dev:all
```

3. Open your browser:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Default Admin Account

On first run, a default admin account is created:
- **Email**: admin@poker.com
- **Password**: admin123

**Important**: Change these credentials in production!

### Default Game Templates

Three templates are created automatically:
- Texas Hold'em (1000 base points)
- Omaha (1500 base points)
- Board Game Night (100 base points)

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend only |
| `npm run server` | Start backend only |
| `npm run dev:all` | Start both frontend and backend |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Project Structure

```
├── public/              # Static assets
├── server/
│   └── index.js         # Express backend + SQLite
├── src/
│   ├── assets/          # Images, fonts
│   ├── components/      # Reusable Vue components
│   │   └── Navbar.vue
│   ├── router/          # Vue Router configuration
│   │   └── index.js
│   ├── services/        # API service layer
│   │   └── api.js
│   ├── stores/          # Pinia state stores
│   │   ├── auth.js
│   │   └── games.js
│   ├── views/           # Page components
│   │   ├── admin/       # Admin-only pages
│   │   ├── Dashboard.vue
│   │   ├── GameDetail.vue
│   │   ├── Games.vue
│   │   ├── Home.vue
│   │   ├── Leaderboard.vue
│   │   ├── Login.vue
│   │   ├── Profile.vue
│   │   └── Register.vue
│   ├── App.vue          # Root component
│   ├── main.js          # Entry point
│   └── style.css        # Global styles
├── index.html
├── package.json
└── vite.config.js
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new player
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile name

### Templates (Admin only for create/update/delete)
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Players
- `GET /api/players` - List all players

### Games
- `GET /api/games` - List all games
- `GET /api/games/:id` - Get game details
- `POST /api/games` - Create new game (Admin)
- `POST /api/games/:id/players` - Add player to game (Admin)
- `PUT /api/games/:id/players/:playerId` - Update player score (Admin)
- `PUT /api/games/:id/end` - End game (Admin)

### Leaderboard
- `GET /api/leaderboard` - Get all-time rankings

## User Roles

| Feature | Player | Admin |
|---------|--------|-------|
| Register/Login | ✓ | ✓ |
| Update own profile | ✓ | ✓ |
| View games | ✓ | ✓ |
| View leaderboard | ✓ | ✓ |
| Create/Edit templates | ✗ | ✓ |
| Start new games | ✗ | ✓ |
| Add players to games | ✗ | ✓ |
| Update scores | ✗ | ✓ |
| End games | ✗ | ✓ |

## Notes

- Players cannot be removed from a game once added
- Scores are only counted toward leaderboard when a game is ended
- The SQLite database file is stored at `server/poker.db`
