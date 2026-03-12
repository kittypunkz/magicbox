# MagicBox Makefile
# Usage: make [command]

.PHONY: help install dev deploy update backend frontend migrate clean

# Default target
help:
	@echo "MagicBox Commands:"
	@echo "  make install    - Install all dependencies"
	@echo "  make dev        - Start local development"
	@echo "  make update     - Deploy all updates"
	@echo "  make backend    - Deploy backend only"
	@echo "  make frontend   - Deploy frontend only"
	@echo "  make migrate    - Run database migrations"
	@echo "  make check      - Type check all code"
	@echo "  make clean      - Clean build files"

# Install dependencies
install:
	@echo "Installing root dependencies..."
	npm install
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Start development
backend-dev:
	cd backend && npm run dev

frontend-dev:
	cd frontend && npm run dev

dev:
	@echo "Starting both backend and frontend..."
	npm run dev

# Type checking
check-backend:
	cd backend && npx tsc --noEmit

check-frontend:
	cd frontend && npx tsc --noEmit

check: check-backend check-frontend

# Deployment
update:
	./update.sh

backend:
	./update.sh backend

frontend:
	./update.sh frontend

migrate:
	./update.sh migrate

# Database
db-create:
	cd backend && npx wrangler d1 create magicbox-db

db-migrate:
	cd backend && npx wrangler d1 migrations apply magicbox-db --remote

db-local:
	cd backend && npx wrangler d1 migrations apply magicbox-db --local

# Cleaning
clean:
	cd frontend && rm -rf dist node_modules/.vite
	cd backend && rm -rf node_modules/.cache

# Production build
build:
	cd frontend && npm run build

# Full deployment (Windows)
windows-update:
	update.bat
