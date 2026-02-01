#!/bin/bash
# AWS Lightsail/EC2 Deployment Script for Poker Points Tracker
# Run this on your AWS server after uploading the code

set -e

echo "🚀 Starting deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install dependencies
echo "📦 Installing app dependencies..."
npm install --registry https://registry.npmjs.org

# Build frontend for production
echo "🔨 Building frontend..."
npm run build

# Update API URL for production
# The frontend will use relative URLs which nginx will proxy

# Setup Nginx
echo "🔧 Configuring Nginx..."
sudo cp nginx.conf /etc/nginx/sites-available/poker-app
sudo ln -sf /etc/nginx/sites-available/poker-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Start the API server with PM2
echo "🚀 Starting API server..."
pm2 delete poker-api 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# Setup PM2 to start on boot
echo "🔧 Setting up auto-start..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
pm2 save

# Open firewall ports
echo "🔓 Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your app is now running at: http://$(curl -s ifconfig.me)"
echo ""
echo "Default admin login:"
echo "  Email: admin@poker.com"
echo "  Password: admin123"
echo ""
echo "⚠️  Remember to:"
echo "  1. Change the admin password"
echo "  2. Set a secure JWT_SECRET in ecosystem.config.cjs"
echo "  3. Setup SSL with: sudo certbot --nginx (optional)"
