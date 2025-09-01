# Timezone Service

A modern HTTP Node.js server with timezone API endpoints, built with TypeScript, Docker, and clean architecture principles.

## 🚀 Features

- **TypeScript** with strict typing and no `any` types
- **Decorator-based routing** (`@GET`, `@PARAM`)
- **Dependency injection** system with service registry
- **Docker** containerization for development and production
- **Clean architecture** with modular service structure
- **Code quality** tools (ESLint, Prettier)
- **Comprehensive error handling** and validation
- **20+ timezone identifiers** support
- **date-fns-tz** integration for reliable timezone handling

## 📡 API Endpoints

- `GET /` - API information
- `GET /healthcheck` - Health check endpoint
- `GET /time/:timezone` - Get current time in specified timezone

### Examples

```bash
curl http://localhost:3000/time/Etc/UTC
curl http://localhost:3000/time/America/New_York
curl http://localhost:3000/time/Europe/London
curl http://localhost:3000/healthcheck
```

## 🛠️ Quick Start

### Prerequisites

- Docker and Docker Compose
- Make (optional, for convenience commands)
- Node.js 18+ (for local development)

### Using Make (Recommended)

```bash
# Show all available commands
make help

# Start development environment
make dev

# Start production environment
make prod

# Run linting and formatting
make lint-fix

# Install dependencies locally
make install

# Build the application
make build
```

### Using Docker Compose Directly

```bash
# Development
docker-compose -f docker-compose.dev.yml up --build

# Production
docker-compose up --build
```

### Local Development (without Docker)

```bash
cd timezone-service
npm install
npm run dev
```

## 📁 Project Structure

```
.
├── timezone-service/           # Main service code
│   ├── src/                   # Source code
│   │   ├── controllers/       # Route controllers
│   │   ├── services/          # Business logic services
│   │   │   └── timezone/      # Timezone module
│   │   ├── routing/           # Routing system
│   │   └── shared/            # Shared utilities
│   ├── Dockerfile             # Production Docker image
│   ├── Dockerfile.dev         # Development Docker image
│   ├── package.json           # Dependencies and scripts
│   └── tsconfig.json          # TypeScript configuration
├── docker-compose.yml         # Production compose
├── docker-compose.dev.yml     # Development compose
├── Makefile                   # Convenience commands
└── README.md                  # This file
```

## 🐳 Docker Configuration

### Development
- **Hot reload** enabled with volume mounting
- **Full development dependencies** installed
- **Source code mounting** for instant changes
- **Port 3000** exposed

### Production
- **Multi-stage build** for optimized image size
- **Non-root user** for security
- **Health checks** configured
- **Resource limits** applied
- **Logging** configured

## 🔧 Available Make Commands

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make install` | Install dependencies |
| `make build` | Build the application |
| `make clean` | Clean build artifacts |
| `make lint` | Run ESLint |
| `make format` | Format code with Prettier |
| `make lint-fix` | Auto-fix linting and format |
| `make dev` | Start development environment |
| `make prod` | Start production environment |
| `make up` | Start development services |
| `make down` | Stop all services |
| `make logs` | Show container logs |
| `make demo` | Run demo script |
| `make health` | Check service health |

## 🧪 Testing

```bash
# Run demo script
make demo

# Check service health
make health

# View logs
make logs
```

## 🏗️ Architecture

### Decorator-Based Routing
```typescript
@GET('/time/:timezone')
getTimeByTimezone(
  @PARAM('timezone') timezone: string,
  timezoneService: TimezoneService
): TimezoneResponse
```

### Dependency Injection
```typescript
// Automatic service injection
class TimezoneController {
  constructor() {
    // Services are automatically injected
  }
}
```

### Type Safety
```typescript
interface TimezoneResponse {
  timezone: string;
  current_time: string;
  timestamp: string;
}
```

## 🌍 Supported Timezones

- `Etc/UTC`
- `America/New_York`
- `Europe/London`
- `Asia/Tokyo`
- `Australia/Sydney`
- `America/Los_Angeles`
- `Europe/Paris`
- `Asia/Kolkata`
- `Pacific/Honolulu`
- `Africa/Cairo`
- And many more...

## 📊 Code Quality

- **ESLint** with TypeScript rules
- **Prettier** for consistent formatting
- **Strict TypeScript** configuration
- **No `any` types** policy
- **Import organization** with custom rules

## 🚀 Deployment

### Production with Docker

```bash
# Build and start production environment
make prod

# Or manually
docker-compose up --build -d
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Server port |

## 📝 Development

### Adding New Endpoints

1. Create a controller in `src/controllers/`
2. Use `@GET` and `@PARAM` decorators
3. Register the controller in `src/server.ts`
4. Add types in appropriate service modules

### Code Style

```bash
# Check code style
make check

# Auto-fix issues
make lint-fix
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `make lint-fix` to ensure code quality
5. Test with `make demo`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Docker Documentation](https://docs.docker.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [date-fns-tz Documentation](https://date-fns.org/docs/Time-Zones)