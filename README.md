# Bird Flashcards App

A full-stack TypeScript application for learning bird identification through interactive flashcards. Built with NestJS backend, Next.js frontend, and PostgreSQL database.

## Project Structure

```
flashcards/
├── backend/          # NestJS API server
├── frontend/         # Next.js React application
├── shared/           # Shared TypeScript types
├── docker-compose.yml # PostgreSQL container setup
└── backend/.env     # Backend environment variables
```

## Prerequisites

- **Node.js** 18+
- **Docker Desktop** (for PostgreSQL database)
- **Yarn** 4.0+ (package manager)

## Quick Start

### 1. Install Dependencies

```bash
yarn install
```

### 2. Configure Backend Environment Variables

The backend requires environment variables in `backend/.env`. Copy the example file and configure necessary variables:

```bash
cp backend/.env.example backend/.env
```

### 3. Start Database

```bash
# Start PostgreSQL container
yarn db:up

# Verify container is running
docker ps
```

### 4. Start Ngrok Tunnel and Configure Google OAuth

```bash
# Start Ngrok
ngrok http http://localhost:3001
```

Copy the forwarding URL and:

1. Update GOOGLE_CALLBACK_URL in `backend/.env`
1. Update [Google Client](https://console.cloud.google.com/) with:
   1. The correct JavaScript origin AND
   1. The authorized redirect URI (make sure the redirect URI ends with `auth/google/callback`)

### 5. Start Both Services

```bash
# Start backend and frontend concurrently
yarn dev
```

The backend will be available at `http://localhost:3001`

The frontend will be available at `http://localhost:3000`

## Testing

The project includes comprehensive unit and integration tests for both backend and frontend.

```bash
# Run all tests (backend + frontend)
yarn test

# Run all tests with coverage reports
yarn test:coverage

# Run backend tests only
yarn test:backend

# Run frontend tests only
yarn test:frontend
```

## Development Commands

### Database Management

```bash
# Start PostgreSQL container
docker compose up -d postgres

# Stop PostgreSQL container
docker compose down

# View database logs
docker logs flashcards-db

# Connect to database directly
docker exec -it flashcards-db psql -U flashcards_user -d flashcards
```

### Backend Development

```bash
# Start in development mode (auto-reload)
yarn workspace backend start:dev

# Build for production
yarn workspace backend build

# Start production build
yarn workspace backend start:prod

# Run in debug mode
yarn workspace backend start:debug
```

### Frontend Development

```bash
# Start development server
yarn workspace frontend dev

# Build for production
yarn workspace frontend build

# Start production server
yarn workspace frontend start

# Run linting
yarn workspace frontend lint
```

### Yarn Workspace Commands

```bash
# Install dependencies for all workspaces
yarn install

# Run a command in a specific workspace
yarn workspace backend [command]
yarn workspace frontend [command]
yarn workspace shared [command]

# Run a command in all workspaces (Yarn 1.x)
yarn workspaces run [command]

# Build specific workspaces
yarn workspace backend build
yarn workspace frontend build
yarn workspace shared build

# Clean all workspaces
yarn clean
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL container is running
docker ps

# Restart database container
docker compose restart postgres

# Check database logs
docker logs flashcards-db
```

### Backend Issues

```bash
# Check if port 3001 is available
lsof -i :3001

# Kill any existing process on port 3001
pkill -f "nest start"

# Verify environment variables are loaded
yarn workspace backend start:dev
```

### Docker Issues

```bash
# Restart Docker Desktop
# Check Docker is running
docker --version

# Remove and recreate containers
docker compose down
docker compose up -d postgres
```
