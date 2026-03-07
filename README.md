# ⚖️ NEETHIVAAN
### AI-Driven Legal Awareness & Grievance Management Platform

> A full-stack MERN application built with **React + TypeScript (Vite)** on the frontend and **Node.js + TypeScript + Express** on the backend, backed by **MongoDB (Mongoose)**.

---

## 🗂️ Project Structure

```
NEETHIVAAN/
├── server/
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # Auth, error handler, rate limiter
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Email, cron
│   │   ├── ml/             # Intent classifier (keyword + ML stubs)
│   │   │   └── artifacts/  # model.json placeholder
│   │   ├── utils/          # ID generator, draft generator, PDF
│   │   └── seed.ts         # Seed script
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── components/     # Layout
│   │   ├── context/        # AuthContext
│   │   ├── i18n/           # English + Hindi locales
│   │   ├── pages/          # All page components
│   │   └── utils/          # API, PDF export, status badges
│   ├── package.json
│   └── vite.config.ts
├── .github/workflows/ci.yml
├── render.yaml
├── netlify.toml
├── package.json            # Root with concurrently
└── README.md
```

---

## 🚀 Quick Start (Local Dev)

### 1. Prerequisites
- Node.js ≥ 18
- MongoDB running locally OR a MongoDB Atlas URI

### 2. Clone & install
```bash
git clone https://github.com/yourusername/neethivaan.git
cd NEETHIVAAN
npm run install:all
```

### 3. Configure environment
```bash
# Server
cp server/.env.example server/.env
# Edit server/.env — set MONGODB_URI and JWT_SECRET at minimum

# Client
cp client/.env.example client/.env
# VITE_API_URL=http://localhost:5000  (default — no change needed for local)
```

### 4. Seed the database
```bash
npm run seed
# Output:
# ✅ Connected to MongoDB
#   👤 Created admin: admin@neethivaan.test / AdminPass123!
#   👤 Created user:  user@neethivaan.test  / UserPass123!
#   📋 Created complaint: NV-1234567890-4321 [Submitted] – Consumer Fraud
#   📋 Created complaint: NV-... [Under Review] – Labour Dispute
#   ...
# 🎉 Seed complete!
```

### 5. Run both servers
```bash
npm run dev
# Server: http://localhost:5000
# Client: http://localhost:5173
```

---

## 🔑 Demo Credentials
| Role  | Email                     | Password     |
|-------|---------------------------|--------------|
| Admin | admin@neethivaan.test     | AdminPass123!|
| User  | user@neethivaan.test      | UserPass123! |

> ⚠️ **Change these before deploying to production!**

---

## 🧪 API Testing (curl)

### Register a new user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test1234!","role":"user"}'
# Response:
# {"success":true,"token":"eyJhbGci...","user":{"_id":"...","name":"Test User","email":"test@example.com","role":"user"}}
```

### Login (returns JWT)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@neethivaan.test","password":"AdminPass123!"}'
# Response:
# {"success":true,"token":"eyJhbGci...","user":{...}}
# Save the token: export TOKEN=eyJhbGci...
```

### Create a complaint
```bash
curl -X POST http://localhost:5000/api/complaints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "category": "Consumer Fraud",
    "description": "I purchased a laptop online but received an empty box. The seller is refusing to refund.",
    "priority": "High"
  }'
# Response:
# {"success":true,"complaint":{"complaintId":"NV-1703123456789-7823",...},"aiResult":{"intent":"consumer_fraud","domain":"consumer","suggestedActs":["Consumer Protection Act 2019"],"confidence":0.6}}
```

### Get complaint by ID
```bash
curl http://localhost:5000/api/complaints/NV-1703123456789-7823 \
  -H "Authorization: Bearer $TOKEN"
```

### Update complaint status (admin)
```bash
curl -X PATCH http://localhost:5000/api/complaints/NV-1703123456789-7823/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"In Progress","remark":"Assigned to review team"}'
```

### Classify intent (public — no auth needed)
```bash
curl -X POST http://localhost:5000/api/ai/classify \
  -H "Content-Type: application/json" \
  -d '{"text":"My employer has not paid my salary for 2 months"}'
# Response:
# {"success":true,"result":{"intent":"labour_dispute","domain":"labour","suggestedActs":["Industrial Disputes Act 1947","Payment of Wages Act 1936"],"confidence":0.6}}
```

### Get analytics (admin)
```bash
curl http://localhost:5000/api/admin/analytics/status-counts \
  -H "Authorization: Bearer $TOKEN"
# Response:
# {"success":true,"data":[{"status":"Submitted","count":2},{"status":"Resolved","count":1},...]}

curl http://localhost:5000/api/admin/analytics/monthly-trends \
  -H "Authorization: Bearer $TOKEN"

curl http://localhost:5000/api/admin/analytics/avg-resolution-time \
  -H "Authorization: Bearer $TOKEN"
```

### Get audit logs (admin)
```bash
curl http://localhost:5000/api/admin/audit-logs \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🏗️ Production Build

```bash
npm run build
# Builds server → server/dist/
# Builds client → client/dist/
```

---

## ☁️ Deployment Guide

### Step 1 — MongoDB Atlas (free)
1. Go to https://cloud.mongodb.com → Create free M0 cluster
2. **Database Access** → Add user → Username + Password
3. **Network Access** → Add IP: `0.0.0.0/0` (allow all — restrict in production)
4. **Connect** → Driver → Copy the connection string:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/neethivaan`

---

### Step 2 — Backend on Render (free)
1. Push code to GitHub: `git push origin main`
2. Go to https://render.com → **New → Web Service**
3. Connect your GitHub repo → Select the **NEETHIVAAN** repo
4. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/index.js`
   - **Plan**: Free
5. **Environment Variables** → Add each variable:
   ```
   NODE_ENV           = production
   PORT               = 5000
   MONGODB_URI        = mongodb+srv://...  (from Atlas)
   JWT_SECRET         = <your-long-secret>
   JWT_EXPIRES_IN     = 7d
   BCRYPT_SALT_ROUNDS = 10
   CORS_ORIGINS       = https://your-app.vercel.app
   EMAIL_USER         = yourgmail@gmail.com
   EMAIL_PASS         = your_app_password
   AUTO_ESCALATE_DAYS = 5
   ```
6. Click **Create Web Service**. Note the URL: `https://neethivaan-api.onrender.com`

---

### Step 3a — Frontend on Vercel (recommended)
1. Go to https://vercel.com → **New Project** → Import GitHub repo
2. **Root Directory**: `client`
3. **Framework**: Vite
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Environment Variables**:
   ```
   VITE_API_URL = https://neethivaan-api.onrender.com
   ```
7. Click **Deploy**

### Step 3b — Frontend on Netlify (alternative)
1. Go to https://app.netlify.com → **Add new site → Import from Git**
2. Choose GitHub → Select repo
3. **Base directory**: `client`
4. **Build command**: `npm run build`
5. **Publish directory**: `client/dist`
6. **Environment Variables**:
   ```
   VITE_API_URL = https://neethivaan-api.onrender.com
   ```
7. Click **Deploy**
8. After deploy: copy the Netlify URL → back to Render → add to `CORS_ORIGINS`

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| `MongoServerError: connection refused` | Check `MONGODB_URI` is correct. On Atlas, verify Network Access allows your IP (or `0.0.0.0/0`). |
| `JsonWebTokenError: invalid signature` | Ensure `JWT_SECRET` is identical in server `.env` and Render env vars. |
| CORS errors in browser | Add the frontend URL to `CORS_ORIGINS` env var on Render, then **redeploy**. |
| Email not sending | Use a **Gmail App Password** (not account password). Or set `EMAIL_USER`/`EMAIL_PASS` empty to skip (emails log to console). |
| Render cold start slow | Free tier spins down after inactivity. First request takes ~30s. Upgrade to paid for always-on. |
| `ts-node-dev not found` | Run `npm install` inside the `server/` folder. |
| Vite env vars not working | All frontend env vars **must** start with `VITE_`. |

---

## ✅ Presentation Checklist (10 items)

1. [ ] Server running: `npm run dev` — both ports 5000 and 5173 active
2. [ ] Seeded accounts visible: login as admin and user
3. [ ] Submit a new complaint — ID generated (NV-...), AI classification shows
4. [ ] AI intent classification live preview (type in description field)
5. [ ] Admin updates status → timeline entry added, email logged
6. [ ] Analytics dashboard shows status pie + monthly trend charts
7. [ ] PDF export downloaded via jsPDF on complaint detail page
8. [ ] Language switcher toggles English ↔ Hindi across all UI labels
9. [ ] Audit log page shows login, complaint_create, status_update events
10. [ ] Auto-escalation cron: change `AUTO_ESCALATE_DAYS=0`, restart server, wait for 2 AM log or set cron to every minute for demo
11. [ ] CORS + Helmet + Rate limiter working (show 429 on >10 rapid logins)
12. [ ] Deployed URL accessible on Render + Vercel/Netlify

---

## 🎤 3-Minute Demo Script

**[0:00 – 0:30] Setup**
> "This is NEETHIVAAN — an AI-powered legal grievance portal. Let me show you the full flow."
- Open `http://localhost:5173`
- Login as `admin@neethivaan.test / AdminPass123!`

**[0:30 – 1:00] Submit a Complaint**
> "I'll submit a complaint as a regular user."
- Logout → Login as `user@neethivaan.test`
- Go to **New Complaint**
- Type: *"My employer has not paid salary for 3 months"*
- *Show the AI classification box updating live*: intent = `labour_dispute`, acts = Industrial Disputes Act
- Click Submit → Note complaint ID `NV-...`

**[1:00 – 1:30] Admin Review + Status Update**
> "Now as admin, I'll review and update the complaint."
- Logout → Login as admin
- Open the complaint from **Admin Panel**
- Change status to `In Progress` + add remark
- *Show timeline updated*

**[1:30 – 2:00] Analytics**
> "The admin dashboard shows real-time analytics."
- Go to **Dashboard**
- Show status pie chart and monthly trend line

**[2:00 – 2:30] PDF Export + Language**
> "Users can download a formal complaint draft as PDF."
- Go back to complaint → click **Download Draft PDF**
- *PDF downloads with formal letter format*
- Go to **Settings** → switch language to Hindi
- *All labels switch to Hindi*

**[2:30 – 3:00] Security + Audit**
> "Finally, let me show the audit trail and security features."
- Go to **Audit Logs** → show login, create, status_update entries
- Mention: Helmet, rate limiting (10 req/15min on auth), JWT blacklist on logout

---

## 🗺️ ML Roadmap (Future Upgrades)

- **Phase 2**: Replace keyword rules with TF-IDF + Naive Bayes using `natural` library. Train on 500+ labelled complaints. Expected accuracy: ~85%.
- **Phase 3**: Fine-tune a `DistilBERT` model on legal complaint data using HuggingFace. Serve via Python FastAPI microservice. Target accuracy: ~93%.
- **Phase 4**: Collect user feedback on AI suggestions (thumbs up/down) to build a continuously improving labelled dataset.
- **Phase 5**: CI pipeline for model retraining — GitHub Actions triggers `python train.py` when training_data.jsonl grows by 50+ examples.
- **Phase 6**: Deploy model to HuggingFace Inference API or Replicate for serverless ML serving.
