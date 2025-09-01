# Timezone Service Makefile
# Usage: make <target>

.PHONY: help install build clean lint format lint-fix dev prod up down logs test demo

# Default target
help: ## Show this help message
	@echo "Timezone Service - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make install     # Install dependencies"
	@echo "  make dev         # Start development environment"
	@echo "  make prod        # Start production environment"
	@echo "  make lint        # Run ESLint"
	@echo "  make format      # Format code with Prettier"

# Installation and setup
install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	cd timezone-service && npm install

# Build and clean
build: ## Build the application
	@echo "🏗️  Building application..."
	cd timezone-service && npm run build

clean: ## Clean build artifacts and dependencies
	@echo "🧹 Cleaning up..."
	cd timezone-service && rm -rf dist node_modules
	docker system prune -f
	docker volume prune -f

# Code quality
lint: ## Run ESLint
	@echo "🔍 Running ESLint..."
	cd timezone-service && npm run lint

format: ## Format code with Prettier
	@echo "✨ Formatting code with Prettier..."
	cd timezone-service && npm run format

lint-fix: ## Run ESLint with auto-fix and Prettier
	@echo "🔧 Running ESLint with auto-fix and Prettier..."
	cd timezone-service && npm run lint:fix && npm run format

check: ## Check code quality (lint + format check)
	@echo "✅ Checking code quality..."
	cd timezone-service && npm run lint && npm run format:check

# Development
dev: ## Start development environment with Docker
	@echo "🚀 Starting development environment..."
	docker-compose -f docker-compose.dev.yml up --build

dev-local: ## Start development server locally (without Docker)
	@echo "🚀 Starting development server locally..."
	cd timezone-service && npm run dev

# Production
prod: ## Start production environment with Docker
	@echo "🚀 Starting production environment..."
	docker-compose up --build -d

# Docker management
up: ## Start services (development by default)
	@echo "⬆️  Starting services..."
	docker-compose -f docker-compose.dev.yml up -d

up-prod: ## Start production services
	@echo "⬆️  Starting production services..."
	docker-compose up -d

down: ## Stop and remove containers
	@echo "⬇️  Stopping services..."
	docker-compose -f docker-compose.dev.yml down
	docker-compose down

restart: ## Restart development services
	@echo "🔄 Restarting services..."
	make down && make up

logs: ## Show logs from running containers
	@echo "📋 Showing logs..."
	docker-compose -f docker-compose.dev.yml logs -f

logs-prod: ## Show production logs
	@echo "📋 Showing production logs..."
	docker-compose logs -f

# Testing and demo
test: ## Run tests (placeholder for future implementation)
	@echo "🧪 Running tests..."
	cd timezone-service && npm test || echo "⚠️  Tests not implemented yet"

demo: ## Run demo script
	@echo "🎬 Running demo..."
	cd timezone-service && npm run demo

# Health check
health: ## Check service health
	@echo "❤️  Checking service health..."
	@curl -f http://localhost:3000/healthcheck || echo "❌ Service is not healthy"

# Docker utilities
docker-build-dev: ## Build development Docker image
	@echo "🐳 Building development Docker image..."
	docker build -f timezone-service/Dockerfile.dev -t timezone-service:dev timezone-service

docker-build-prod: ## Build production Docker image
	@echo "🐳 Building production Docker image..."
	docker build -f timezone-service/Dockerfile -t timezone-service:latest timezone-service

docker-clean: ## Clean Docker images and containers
	@echo "🧹 Cleaning Docker resources..."
	docker system prune -af
	docker volume prune -f

# Git helpers
status: ## Show git and Docker status
	@echo "📊 Git status:"
	@git status --short
	@echo ""
	@echo "🐳 Docker containers:"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Environment setup
setup: ## Initial project setup
	@echo "🛠️  Setting up project..."
	make install
	make build
	@echo "✅ Setup complete! Try 'make dev' to start development"
