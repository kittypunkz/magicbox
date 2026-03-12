# 🚀 Deploy MagicBox to magicbox.bankapirak.com

## Prerequisites

1. **Cloudflare Account**: Sign up at https://dash.cloudflare.com (free)
2. **Domain**: `bankapirak.com` must be added to Cloudflare
3. **Wrangler CLI**: Will be installed automatically

## Quick Deploy (One Command)

```bash
cd magicbox
./deploy.sh        # Mac/Linux
# OR
deploy.bat         # Windows
```

This will:
- ✅ Create D1 database
- ✅ Initialize schema
- ✅ Deploy backend to `api.magicbox.bankapirak.com`
- ✅ Deploy frontend to `magicbox.bankapirak.com`
- ✅ Verify deployment

## Step-by-Step (Manual)

### Step 1: Add Domain to Cloudflare

1. Go to https://dash.cloudflare.com
2. Click "Add a Site"
3. Enter `bankapirak.com`
4. Select Free plan
5. Update nameservers at your domain registrar to Cloudflare's nameservers
6. Wait for DNS propagation (can take up to 24 hours, usually 5 minutes)

### Step 2: Login to Wrangler

```bash
npx wrangler login
```

### Step 3: Create Database

```bash
cd backend
npx wrangler d1 create magicbox-db
```

Copy the database ID and update `wrangler.toml`.

### Step 4: Initialize Database

```bash
npx wrangler d1 execute magicbox-db --remote --file=../database/schema.sql
```

### Step 5: Deploy Backend

```bash
npx wrangler deploy
```

### Step 6: Deploy Frontend

```bash
cd ../frontend
npm install
npm run build
npx wrangler pages deploy dist --project-name=magicbox-app
```

## Domain Configuration

### Option A: Cloudflare Managed Domain (Recommended)

If `bankapirak.com` is using Cloudflare nameservers:

1. Go to Cloudflare Dashboard → `bankapirak.com` → DNS
2. Ensure these records exist (automatically created by Workers/Pages):
   ```
   Type: CNAME | Name: magicbox | Target: magicbox-app.pages.dev
   Type: CNAME | Name: api.magicbox | Target: magicbox-api.your-subdomain.workers.dev
   ```

3. Go to Cloudflare Dashboard → Workers & Pages
4. Find `magicbox-app` → Custom Domains
5. Add `magicbox.bankapirak.com`

### Option B: External DNS

If DNS is managed elsewhere:

1. Add these DNS records at your registrar:
   ```
   CNAME  magicbox.bankapirak.com     →  cname.cloudflare.com
   CNAME  api.magicbox.bankapirak.com →  your-worker-subdomain.workers.dev
   ```

## Verification

After deployment, verify:

```bash
# Test API
curl https://api.magicbox.bankapirak.com/

# Should return:
# {"name":"MagicBox API","version":"1.0.0","status":"running"}

# Test Frontend
open https://magicbox.bankapirak.com
```

## Updates & Redeploy

### Update Backend Only
```bash
cd backend
npx wrangler deploy
```

### Update Frontend Only
```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=magicbox-app
```

### Full Redeploy
```bash
./deploy.sh full
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `wrangler not found` | Run `npm install -g wrangler` |
| `Not authorized` | Run `npx wrangler login` |
| Database connection error | Check `database_id` in `wrangler.toml` |
| CORS errors | Verify API URL in `frontend/src/api/client.ts` |
| DNS not resolving | Wait 5-30 minutes for propagation |
| 404 on frontend | Ensure `dist` folder exists with build output |

## Live URLs After Deployment

| Component | URL |
|-----------|-----|
| 🌐 Web App | https://magicbox.bankapirak.com |
| 🔌 API | https://api.magicbox.bankapirak.com |
| 📁 Folders | https://api.magicbox.bankapirak.com/folders |
| 📝 Notes | https://api.magicbox.bankapirak.com/notes |
| 🔍 Search | https://api.magicbox.bankapirak.com/search |

## SSL/TLS

Cloudflare automatically provides SSL certificates for:
- `magicbox.bankapirak.com`
- `api.magicbox.bankapirak.com`

No additional configuration needed!
