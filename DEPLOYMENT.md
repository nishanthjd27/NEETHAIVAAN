/*
# NEETHIVAAN – Production Deployment Guide

---

## 1. MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com → Create free M0 cluster.
2. Database Access → Add user with Read/Write to any database.
3. Network Access → Add IP: `0.0.0.0/0` (allow all, required for Render).
4. Clusters → Connect → Connect your application → copy the connection string.
5. Replace `<password>` in the connection string with your DB user password.
6. Set this as `MONGO_URI` in your backend environment.

---

## 2. Backend — Deploy on Render

### Steps
1. Push `backend/` to a GitHub repository.
2. Go to https://render.com → New → Web Service.
3. Connect your GitHub repo.
4. Configure:
   | Field         | Value                            |
   |---------------|----------------------------------|
   | Runtime       | Node                             |
   | Build Command | `npm install && npm run build`   |
   | Start Command | `node dist/server.js`            |
   | Root Dir      | `backend`                        |

5. Environment Variables (set in Render dashboard):
   ```
   NODE_ENV        = production
   PORT            = 5000
   MONGO_URI       = <your Atlas connection string>
   JWT_SECRET      = <64-char random hex>
   CLIENT_URL      = <your Vercel frontend URL>
   ```
6. Click Deploy. Wait for "Live" status.
7. Copy your Render URL (e.g. `https://neethivaan-api.onrender.com`).

### backend/package.json scripts (ensure these exist)
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev":   "ts-node-dev --respawn src/server.ts"
  }
}
```

### backend/tsconfig.json — minimum required
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

---

## 3. Frontend — Deploy on Vercel

### Steps
1. Push `frontend/` to a GitHub repository.
2. Go to https://vercel.com → New Project → Import repo.
3. Configure:
   | Field              | Value           |
   |--------------------|-----------------|
   | Framework Preset   | Vite            |
   | Root Directory     | `frontend`      |
   | Build Command      | `npm run build` |
   | Output Directory   | `dist`          |

4. Environment Variables (set in Vercel dashboard):
   ```
   VITE_API_URL = https://neethivaan-api.onrender.com
   ```
5. Click Deploy.

### frontend/vercel.json — SPA routing fix (create this file)
```json
{
  "rewrites": [
    { "source": "/((?!api/.*).*)", "destination": "/index.html" }
  ]
}
```

---

## 4. Environment Variable Reference

### Backend
| Variable        | Required | Description                                   |
|-----------------|----------|-----------------------------------------------|
| NODE_ENV        | ✅       | `production` or `development`                 |
| PORT            | ✅       | Port to listen on (Render sets this auto)     |
| MONGO_URI       | ✅       | Full MongoDB Atlas connection string          |
| JWT_SECRET      | ✅       | Minimum 32 chars, ideally 64-char hex string  |
| JWT_EXPIRES_IN  | ✅       | Token TTL e.g. `7d`, `24h`                   |
| CLIENT_URL      | ✅       | Frontend URL(s) for CORS whitelist            |

### Frontend
| Variable        | Required | Description                                   |
|-----------------|----------|-----------------------------------------------|
| VITE_API_URL    | ✅       | Full URL of backend (no trailing slash)       |

---

## 5. Generate a strong JWT_SECRET

Run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 6. Post-Deploy Checklist

- [ ] Health check responds: `GET /api/health` → `{ "status": "ok" }`
- [ ] Auth endpoints work: `/api/auth/login` and `/api/auth/register`
- [ ] CORS allows Vercel frontend URL
- [ ] MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- [ ] PWA installable in Chrome (DevTools → Application → Manifest)
- [ ] Offline fallback shows when network disconnected
- [ ] AI analyze route returns results: `POST /api/ai/analyze/:id`
*/
