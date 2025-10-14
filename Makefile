# ============================================
# Vaelix Bank API - Makefile
# ============================================
# Simplify common Docker and development operations
# ============================================

.PHONY: help build up down restart logs clean dev test prod monitoring backup restore

# Default target
.DEFAULT_GOAL := help

# ============================================
# Help
# ============================================

help: ## Display this help message
	@echo "🚀 Vaelix Bank API - Development Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "📚 For more information, see README.md"

# ============================================
# Development Environment
# ============================================

dev: ## Start development environment with hot reload
	docker-compose -f docker-compose.dev.yml up --build

dev-build: ## Build development environment
	docker-compose -f docker-compose.dev.yml build

dev-up: ## Start development services in background
	docker-compose -f docker-compose.dev.yml up -d

dev-down: ## Stop development services
	docker-compose -f docker-compose.dev.yml down

dev-logs: ## Show development logs
	docker-compose -f docker-compose.dev.yml logs -f

dev-clean: ## Clean development environment
	docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans

# ============================================
# Production Environment
# ============================================

prod: ## Start production environment
	docker-compose -f docker-compose.prod.yml up -d --build

prod-build: ## Build production environment
	docker-compose -f docker-compose.prod.yml build

prod-up: ## Start production services
	docker-compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production services
	docker-compose -f docker-compose.prod.yml down

prod-logs: ## Show production logs
	docker-compose -f docker-compose.prod.yml logs -f

prod-scale: ## Scale production API services (usage: make prod-scale API=3)
	docker-compose -f docker-compose.prod.yml up -d --scale api=$(API)

# ============================================
# Monitoring & Observability
# ============================================

monitoring: ## Start monitoring stack (Prometheus + Grafana)
	docker-compose -f docker-compose.prod.yml --profile monitoring up -d

monitoring-down: ## Stop monitoring stack
	docker-compose -f docker-compose.prod.yml --profile monitoring down

# ============================================
# Database Operations
# ============================================

db-init: ## Initialize database with schema
	docker-compose -f docker-compose.dev.yml exec postgres psql -U vaelix_user -d vaelix_dev -f /docker-entrypoint-initdb.d/01-schema.sql

db-migrate: ## Run database migrations
	node migrate_encrypt_api_keys.js

db-backup: ## Create database backup
	@echo "Creating database backup..."
	docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U $(DB_USER) -d vaelix_prod > backup_$(shell date +%Y%m%d_%H%M%S).sql

db-restore: ## Restore database from backup (usage: make db-restore FILE=backup.sql)
	@echo "Restoring database from $(FILE)..."
	docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $(DB_USER) -d vaelix_prod < $(FILE)

# ============================================
# Docker Image Operations
# ============================================

build: ## Build Docker image
	./scripts/docker-build.sh

build-multi: ## Build multi-platform Docker image
	./scripts/docker-build.sh --multi

build-dev: ## Build development Docker image
	./scripts/docker-build.sh --dev

test-image: ## Build and test Docker image
	./scripts/docker-build.sh --test

push-ghcr: ## Push Docker image to GitHub Container Registry
	./scripts/docker-build.sh --push-ghcr

push-dockerhub: ## Push Docker image to Docker Hub
	./scripts/docker-build.sh --push-dockerhub

push-multi: ## Push multi-platform Docker image to all registries
	./scripts/docker-build.sh --multi --push-ghcr --push-dockerhub

publish: ## Build, test and publish to all registries
	./scripts/docker-build.sh --test --push-ghcr --push-dockerhub

# ============================================
# Testing & Quality
# ============================================

test: ## Run all tests
	npm test

test-watch: ## Run tests in watch mode
	npm run test:watch

test-coverage: ## Run tests with coverage report
	npm run test:coverage

lint: ## Run ESLint
	npm run lint

lint-fix: ## Fix ESLint issues
	npm run lint:fix

format: ## Format code with Prettier
	npm run format

typecheck: ## Run TypeScript type checking
	npm run typecheck

quality: ## Run all quality checks
	@echo "Running quality checks..."
	@make lint
	@make typecheck
	@make test

# ============================================
# Utility Commands
# ============================================

clean: ## Clean all Docker resources
	docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans
	docker-compose -f docker-compose.prod.yml down --volumes --remove-orphans
	docker system prune -f
	docker volume prune -f

logs: ## Show logs from all services
	docker-compose -f docker-compose.dev.yml logs -f

shell: ## Open shell in API container
	docker-compose -f docker-compose.dev.yml exec api sh

shell-db: ## Open PostgreSQL shell
	docker-compose -f docker-compose.dev.yml exec postgres psql -U vaelix_user -d vaelix_dev

shell-redis: ## Open Redis CLI
	docker-compose -f docker-compose.dev.yml exec redis redis-cli

health: ## Check health of all services
	@echo "Checking API health..."
	@curl -f http://localhost:3000/health || echo "API is not healthy"
	@echo "Checking database..."
	@docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U vaelix_user -d vaelix_dev || echo "Database is not healthy"

# ============================================
# Deployment Commands
# ============================================

deploy-dev: ## Deploy to development environment
	@echo "Deploying to development..."
	@make dev-clean
	@make dev-build
	@make dev-up
	@echo "Development deployment complete!"

deploy-prod: ## Deploy to production environment
	@echo "Deploying to production..."
	@make prod-down
	@make prod-build
	@make prod-up
	@echo "Production deployment complete!"

# ============================================
# Legacy Commands (for backward compatibility)
# ============================================

up: dev-up
down: dev-down
restart: dev-restart
logs: dev-logs