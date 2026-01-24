# GW-Market Development Guide

This guide provides instructions for setting up a local development environment.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm
- Git

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/Eta92/GW-Market.git
cd GW-Market

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 2. Build the Client

```bash
cd client
npm run once    # Single build
# OR
npm run watch   # Watch mode for development
```

### 3. Start the Server

```bash
cd server
npm run start
```

### 4. Access the Application

Open your browser and navigate to: `http://localhost:3026`

## Project Structure

```
GW-Market/
├── client/                 # Angular 18 frontend
│   ├── src/
│   │   ├── app/           # Angular components and services
│   │   └── prerendered/   # Pre-rendered pages for SEO
│   └── dist/              # Built output
├── server/                 # Node.js/Express backend
│   ├── app.ts             # Main server entry point
│   ├── src/
│   │   ├── services/      # Business logic services
│   │   └── models/        # Data models
│   └── data/              # Static data files (items, etc.)
└── assets/                 # Static assets (images, fonts)
```

## Environment Configuration

The server uses a `.env` file for configuration:

```env
development = "true"
serverPort = "3026"
```

**Note:** This local version uses fake shops and doesn't require a database.

## Development Scripts

### Client Scripts

| Command | Description |
|---------|-------------|
| `npm run start` | Start Angular dev server |
| `npm run once` | Single development build |
| `npm run watch` | Watch mode build |
| `npm run prod` | Production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests |

### Server Scripts

| Command | Description |
|---------|-------------|
| `npm run start` | Start server with nodemon (auto-reload) |
| `npm run debug` | Start server with Node.js debugger |

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 3026
lsof -ti:3026 | xargs kill -9
```

### Node Module Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Client Build Fails

```bash
# Clear Angular cache
cd client
rm -rf .angular
npm run once
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Test locally
4. Create a Pull Request to the upstream repository
