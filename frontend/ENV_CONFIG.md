# API URL Configuration

## Overview

The application now uses environment variables to manage API URLs, allowing easy switching between development and production environments.

## Environment Files

### `.env` (Development)
```
VITE_API_BASE_URL=http://localhost:8000
```
Used by the React development server (`npm run dev`). Connects to the local Symfony backend running on `localhost:8000`.

### `.env.production` (Production)
```
VITE_API_BASE_URL=http://72.61.97.77:8000
```
Used when building for production (`npm run build`). Connects to the production VPS at `72.61.97.77`.

### `.env.local` (Optional Local Override)
```
VITE_API_BASE_URL=http://localhost:8000
```
Local override for development (gitignored). Useful if you need to override `.env` during development.

## Usage

### Development
1. Start the Symfony backend:
```bash
symfony server:start
# Or use PHP built-in server:
# php -S 127.0.0.1:8000 -t public/
```

2. Start the React dev server:
```bash
cd frontend
npm run dev
```

The app will use `http://localhost:8000` for all API calls (from `.env`).

### Production Build
```bash
cd frontend
npm run build
```

The build will use `http://72.61.97.77:8000` for all API calls (from `.env.production`).

## How It Works

All API calls in React components use the `getApiUrl()` helper function from `src/api/config.js`:

```javascript
import { getApiUrl } from '../api/config';

const response = await fetch(getApiUrl('/api/login'), {
  // ... options
});
```

The `getApiUrl()` function automatically uses the environment variable `VITE_API_BASE_URL`:

```javascript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const getApiUrl = (path) => {
  return `${API_BASE_URL}${path}`;
};
```

## Environment File Precedence

Vite loads environment files in this order (last one wins):
1. `.env` - Common variables
2. `.env.local` - Local overrides (gitignored)
3. `.env.production` - Production-specific (used during `npm run build`)

## Important Notes

- **Never commit API URLs** directly in code - always use the helper function
- `VITE_` prefix is required for Vite to expose variables to the frontend
- The `.env` file uses `localhost:8000` which works for both `localhost` and `127.0.0.1`
- API calls must include `credentials: 'include'` for session cookies to work across domains

## Troubleshooting

### Session cookies not being sent?
- Ensure both backend and frontend are on the **same domain**
- For cross-domain requests, configure CORS on the backend:
  - `nelmio_cors.yaml` must allow credentials
  - `framework.yaml` must use `cookie_samesite: none` and `cookie_secure: false` in development

### Using different local port?
Edit `.env.local`:
```
VITE_API_BASE_URL=http://localhost:8001
```

### Testing with the VPS?
Edit `.env.local`:
```
VITE_API_BASE_URL=http://72.61.97.77:8000
```
