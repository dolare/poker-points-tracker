# Poker Points Tracker

A Vue 3 application for tracking poker and board game scores. **100% free hosting** using GitHub Pages and GitHub as the database.

## Features

- **Player Management**: Admin can add/edit/remove players
- **Permanent Score Storage**: Data stored in GitHub repository (JSON)
- **Game Templates**: Create templates with preset base points
- **Game Sessions**: Track scores for each game session
- **Leaderboard**: View all-time rankings

## Architecture

```
┌─────────────────────────────────────────────┐
│           GitHub Pages (Free)               │
│           Static Vue.js App                 │
└─────────────────┬───────────────────────────┘
                  │ GitHub API
                  ▼
┌─────────────────────────────────────────────┐
│           GitHub Repository                 │
│           data/db.json (Database)           │
└─────────────────────────────────────────────┘
```

**No backend servers required!** Data is stored directly in the repository.

## Live Demo

https://dolare.github.io/poker-points-tracker/

## Default Login

- **Email**: admin@poker.com
- **Password**: admin123

## Setup for Admin (Write Access)

To make changes (add players, start games, update scores):

1. Login as admin
2. Go to Dashboard
3. Generate a [GitHub Personal Access Token](https://github.com/settings/tokens/new?scopes=repo&description=Poker%20Points%20Tracker) with `repo` scope
4. Enter the token in the Dashboard
5. Now you can make changes!

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Deployment

The app auto-deploys to GitHub Pages when you push to `main`:

1. Go to repo Settings → Pages
2. Set Source to "GitHub Actions"
3. Push to `main` - it will deploy automatically

## Project Structure

```
├── .github/workflows/   # GitHub Actions for auto-deploy
├── data/
│   └── db.json          # Database (JSON)
├── src/
│   ├── components/      # Vue components
│   ├── router/          # Vue Router
│   ├── services/        # GitHub API service
│   ├── stores/          # Pinia stores
│   └── views/           # Page components
└── package.json
```

## Tech Stack

- [Vue 3](https://vuejs.org/) - Frontend framework
- [Vite](https://vitejs.dev/) - Build tool
- [Pinia](https://pinia.vuejs.org/) - State management
- [GitHub API](https://docs.github.com/rest) - Data storage
- [GitHub Pages](https://pages.github.com/) - Free hosting

## Cost

**$0/month** - Everything is free!

| Service | Cost |
|---------|------|
| GitHub Pages | Free |
| GitHub API | Free |
| Data Storage | Free (in repo) |
