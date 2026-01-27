# Frontend Setup Instructions

## Prerequisites
- Node.js 18+ installed
- npm or pnpm package manager

## Installation Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```
   
   Or if using pnpm:
   ```bash
   pnpm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   Or if using pnpm:
   ```bash
   pnpm dev
   ```

   The frontend will be available at: `http://localhost:3000`

## Troubleshooting

### If npm/pnpm install fails:
1. Check your internet connection
2. Clear cache: `npm cache clean --force` or `pnpm store prune`
3. Delete `node_modules` and `package-lock.json`/`pnpm-lock.yaml` and try again
4. Check if you're behind a corporate firewall/proxy

### If the server won't start:
- Check that port 3000 is not in use
- Try: `npm run dev -- -p 3001` to use a different port
