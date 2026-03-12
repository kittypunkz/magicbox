#!/bin/bash

# MagicBox Deployment Script for magicbox.bankapirak.com
# Usage: ./deploy.sh [full|backend|frontend]

set -e

DOMAIN="magicbox.bankapirak.com"
API_DOMAIN="api.magicbox.bankapirak.com"
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        print_error "Wrangler CLI not found. Installing..."
        npm install -g wrangler
    fi
    
    if ! wrangler whoami &> /dev/null; then
        print_error "Not logged in to Cloudflare. Please run: wrangler login"
        exit 1
    fi
}

create_database() {
    print_status "Checking D1 Database..."
    
    cd backend
    
    # Check if database exists
    if ! wrangler d1 list | grep -q "magicbox-db"; then
        print_status "Creating D1 Database 'magicbox-db'..."
        DB_OUTPUT=$(wrangler d1 create magicbox-db 2>&1)
        
        # Extract database ID
        DB_ID=$(echo "$DB_OUTPUT" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')
        
        if [ -z "$DB_ID" ]; then
            print_error "Failed to create database or extract ID"
            exit 1
        fi
        
        print_success "Database created with ID: $DB_ID"
        
        # Update wrangler.toml with the new ID
        sed -i.bak "s/database_id = \"\"/database_id = \"$DB_ID\"/" wrangler.toml
        rm -f wrangler.toml.bak
        
        # Initialize schema
        print_status "Initializing database schema..."
        wrangler d1 execute magicbox-db --remote --file=../database/schema.sql
        print_success "Database schema applied"
    else
        print_success "Database 'magicbox-db' already exists"
    fi
    
    cd ..
}

deploy_backend() {
    print_status "Deploying Backend to $API_DOMAIN..."
    
    cd backend
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        print_status "Installing backend dependencies..."
        npm install
    fi
    
    # Deploy
    wrangler deploy
    
    print_success "Backend deployed to: https://$API_DOMAIN"
    cd ..
}

deploy_frontend() {
    print_status "Deploying Frontend to $DOMAIN..."
    
    cd frontend
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Build
    print_status "Building frontend..."
    npm run build
    
    # Deploy
    wrangler pages deploy dist --project-name=magicbox-app
    
    print_success "Frontend deployed to: https://$DOMAIN"
    cd ..
}

verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check API
    API_RESPONSE=$(curl -s https://$API_DOMAIN/ || echo "")
    if echo "$API_RESPONSE" | grep -q "MagicBox API"; then
        print_success "API is running at https://$API_DOMAIN"
    else
        print_warning "API check failed. It may take a few minutes to propagate."
    fi
    
    # Check frontend
    FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/ || echo "000")
    if [ "$FRONTEND_RESPONSE" = "200" ] || [ "$FRONTEND_RESPONSE" = "304" ]; then
        print_success "Frontend is accessible at https://$DOMAIN"
    else
        print_warning "Frontend check returned HTTP $FRONTEND_RESPONSE. DNS may still be propagating."
    fi
}

setup_dns() {
    print_status "DNS Configuration Required"
    echo ""
    echo "Please ensure your DNS records are configured:"
    echo ""
    echo "  Type    Name                          Value                          TTL"
    echo "  ─────────────────────────────────────────────────────────────────────────"
    echo "  CNAME   magicbox.bankapirak.com       cname.cloudflare.com           Auto"
    echo "  CNAME   api.magicbox.bankapirak.com   your-worker-subdomain.workers  Auto"
    echo ""
    echo "Or if using Cloudflare as DNS:"
    echo "  - Add your domain to Cloudflare"
    echo "  - Cloudflare will automatically handle the routing"
    echo ""
    read -p "Press Enter to continue..."
}

# Main
clear
echo "╔════════════════════════════════════════════════════════════╗"
echo "║       MagicBox Deployment - magicbox.bankapirak.com        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

MODE=${1:-full}

check_wrangler

case $MODE in
    full)
        print_status "Starting FULL deployment..."
        setup_dns
        create_database
        deploy_backend
        deploy_frontend
        verify_deployment
        echo ""
        print_success "✨ Deployment complete!"
        echo ""
        echo "Your MagicBox is live at:"
        echo "  🌐 https://$DOMAIN"
        echo "  🔌 https://$API_DOMAIN"
        ;;
    backend)
        print_status "Deploying BACKEND only..."
        deploy_backend
        ;;
    frontend)
        print_status "Deploying FRONTEND only..."
        deploy_frontend
        ;;
    *)
        echo "Usage: ./deploy.sh [full|backend|frontend]"
        exit 1
        ;;
esac

echo ""
