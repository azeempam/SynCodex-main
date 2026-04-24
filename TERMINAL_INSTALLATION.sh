#!/bin/bash
# Installation Commands for SynCodex Terminal Feature

echo "Installing Backend Dependencies..."
cd "SynCodex Backend"
npm install node-pty express-session dotenv

echo "Installing Frontend Dependencies..."
cd ../SynCodex Frontend
npm install xterm xterm-addon-fit xterm-addon-web-links

echo "✅ Installation Complete"
echo ""
echo "Backend packages:"
echo "  - node-pty: Pseudo-terminal library"
echo "  - express-session: Session management"
echo "  - dotenv: Environment variables"
echo ""
echo "Frontend packages:"
echo "  - xterm: Terminal emulator (270KB)"
echo "  - xterm-addon-fit: Auto-resize addon"
echo "  - xterm-addon-web-links: Clickable links"
