# Deployment Guide - M&M Recruitment Audit Dashboard

## 🚀 Quick Deployment Checklist

- [ ] Build project locally
- [ ] Test in development environment
- [ ] Setup Cloudflare API key
- [ ] Create Cloudflare Pages project
- [ ] Deploy to production
- [ ] Verify deployment
- [ ] Configure custom domain (optional)

## 🔧 Prerequisites

### Required Tools
- Node.js 18+ and npm
- Cloudflare account with Pages access
- Git (for version control)
- Wrangler CLI (included in dependencies)

### Required Accounts
- Cloudflare account (free tier works)
- Access to Cloudflare API token with Pages permissions

## 📦 Step 1: Build Project

### Clone/Navigate to Project
```bash
cd /home/user/webapp
```

### Install Dependencies
```bash
npm install
```

### Build for Production
```bash
npm run build
```

**Expected Output:**
```
vite v6.4.1 building SSR bundle for production...
transforming...
✓ 38 modules transformed.
rendering chunks...
dist/_worker.js  55.39 kB
✓ built in 592ms
```

### Verify Build Output
```bash
ls -la dist/
```

Should contain:
- `_worker.js` - Compiled Hono application
- `_routes.json` - Route configuration

## 🔑 Step 2: Setup Cloudflare Authentication

### Option A: Using setup_cloudflare_api_key Tool (Recommended)

The sandbox environment has a built-in tool to configure authentication:

```bash
# This will be called automatically during deployment
# Or you can run it manually to verify setup
```

**If tool is not available:**

### Option B: Manual API Token Setup

1. **Get API Token from Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token"
   - Use "Edit Cloudflare Workers" template
   - Add "Cloudflare Pages" permissions:
     - Account → Cloudflare Pages → Edit
   - Copy the generated token

2. **Configure Wrangler**
   ```bash
   # Set environment variable
   export CLOUDFLARE_API_TOKEN="your-token-here"
   
   # Verify authentication
   npx wrangler whoami
   ```

**Expected Output:**
```
Getting User settings...
👋 You are logged in with an API Token, associated with the email 'your-email@example.com'!
```

## 🌐 Step 3: Create Cloudflare Pages Project

### First Time Setup

```bash
# Navigate to project directory
cd /home/user/webapp

# Create new Pages project
npx wrangler pages project create webapp \
  --production-branch main \
  --compatibility-date 2024-01-01
```

**Interactive Prompts:**
```
? Enter the name of your new project: › webapp
? Enter the production branch name: › main
```

**Expected Output:**
```
✨ Successfully created the 'webapp' project.
🌎 View your project at https://dash.cloudflare.com/pages
```

### Project Settings (Optional)

Edit `wrangler.jsonc` to customize:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "webapp",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"]
}
```

## 📤 Step 4: Deploy to Production

### Deploy Command

```bash
# Build and deploy in one command
npm run deploy:prod
```

**Or manually:**

```bash
# Build first
npm run build

# Then deploy
npx wrangler pages deploy dist --project-name webapp
```

### Deployment Process

**Console Output:**
```
✨ Compiled Worker successfully
🌎 Uploading... (X files)
✨ Success! Uploaded X files (Y.YY sec)

✨ Deployment complete! Take a peek over at
   https://random-hash.webapp.pages.dev
```

### Deployment URLs

You'll receive two URLs:

1. **Production URL**: `https://webapp.pages.dev`
   - Main production deployment
   - Updates on push to main branch

2. **Preview URL**: `https://[commit-hash].webapp.pages.dev`
   - Unique URL for each deployment
   - Useful for testing before going live

## ✅ Step 5: Verify Deployment

### Test Production URL

```bash
# Test main page
curl https://webapp.pages.dev

# Test static assets
curl https://webapp.pages.dev/static/dashboard.js

# Test API endpoint (if any)
curl https://webapp.pages.dev/api/hello
```

### Browser Testing

1. Open `https://webapp.pages.dev` in browser
2. Verify dashboard loads correctly
3. Test Excel upload functionality
4. Check all tabs and visualizations
5. Test filters and interactions
6. Verify responsive design on mobile

### Common Issues After Deployment

**Issue: 404 on static files**
```bash
# Solution: Verify build output includes files
ls -la dist/
ls -la public/static/

# Rebuild if needed
npm run build
```

**Issue: Charts not displaying**
```bash
# Solution: Check CDN libraries in HTML
# Verify Chart.js, XLSX, jsPDF are loading
# Check browser console for errors
```

**Issue: Worker script error**
```bash
# Solution: Check wrangler logs
npx wrangler pages deployment tail --project-name webapp
```

## 🔄 Step 6: Continuous Deployment

### Automatic Deployment via Git

**Connect to GitHub:**

1. **Push to GitHub** (if not done yet)
   ```bash
   git remote add origin https://github.com/yourusername/webapp.git
   git push -u origin main
   ```

2. **Connect in Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Navigate to Pages → webapp
   - Go to Settings → Builds & deployments
   - Click "Connect to Git"
   - Select GitHub repository
   - Configure build settings:
     - Build command: `npm run build`
     - Build output directory: `dist`
     - Root directory: `/`

3. **Automatic Deployments**
   - Every push to `main` triggers production deployment
   - Pull requests create preview deployments
   - Rollback to previous deployment via dashboard

### Manual Deployment

**For quick updates without Git:**

```bash
# Update code locally
# Build
npm run build

# Deploy
npm run deploy:prod
```

## 🌍 Step 7: Custom Domain (Optional)

### Add Custom Domain

**Via Dashboard:**
1. Go to Pages → webapp → Custom domains
2. Click "Set up a custom domain"
3. Enter your domain (e.g., `audit.yourdomain.com`)
4. Follow DNS configuration instructions

**Via CLI:**
```bash
npx wrangler pages domain add audit.yourdomain.com \
  --project-name webapp
```

### DNS Configuration

Add CNAME record in your DNS provider:

```
Type: CNAME
Name: audit
Value: webapp.pages.dev
TTL: Auto
```

**Wait for DNS propagation** (can take up to 24 hours, usually much faster)

### Verify Custom Domain

```bash
# Test custom domain
curl https://audit.yourdomain.com

# Check SSL certificate
curl -I https://audit.yourdomain.com
```

## 🔐 Step 8: Environment Variables (If Needed)

### Add Secrets (Optional)

If you need to store API keys or secrets:

```bash
# Add environment variable
npx wrangler pages secret put API_KEY \
  --project-name webapp

# Prompt will ask for secret value (input is hidden)
```

### List Secrets

```bash
npx wrangler pages secret list \
  --project-name webapp
```

### Delete Secret

```bash
npx wrangler pages secret delete API_KEY \
  --project-name webapp
```

## 📊 Step 9: Monitor Deployment

### View Deployment Logs

```bash
# Real-time logs
npx wrangler pages deployment tail \
  --project-name webapp

# Specific deployment
npx wrangler pages deployment tail \
  --project-name webapp \
  --deployment-id abc123
```

### Check Analytics

**Via Dashboard:**
- Navigate to Pages → webapp → Analytics
- View requests, bandwidth, errors
- Monitor performance metrics

### Check Status

```bash
# List deployments
npx wrangler pages deployment list \
  --project-name webapp

# Check project info
npx wrangler pages project list
```

## 🔄 Step 10: Update Deployment

### Update Process

```bash
# 1. Pull latest code
git pull origin main

# 2. Make changes
# ... edit files ...

# 3. Test locally
npm run build
pm2 restart webapp

# 4. Commit changes
git add .
git commit -m "Update dashboard features"

# 5. Deploy to production
npm run deploy:prod

# Or if using Git integration
git push origin main
```

### Rollback Deployment

**Via Dashboard:**
1. Go to Pages → webapp → Deployments
2. Find previous successful deployment
3. Click "..." menu → "Rollback to this deployment"

**Via CLI:**
```bash
# Promote specific deployment to production
npx wrangler pages deployment promote [DEPLOYMENT_ID] \
  --project-name webapp
```

## 🛠 Troubleshooting

### Build Failures

**Error: "Module not found"**
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Error: "Out of memory"**
```bash
# Solution: Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Deployment Failures

**Error: "Authentication failed"**
```bash
# Solution: Re-authenticate
export CLOUDFLARE_API_TOKEN="your-new-token"
npx wrangler whoami
```

**Error: "Project not found"**
```bash
# Solution: Create project first
npx wrangler pages project create webapp
```

### Runtime Errors

**Error: "Worker exceeded CPU time"**
- Optimize data processing
- Use pagination for large datasets
- Consider D1 database for data storage

**Error: "Worker exceeded size limit"**
- Reduce dependencies
- Remove unused code
- Use dynamic imports for large libraries

## 📋 Deployment Checklist Summary

**Pre-Deployment:**
- ✅ Code tested locally
- ✅ Build succeeds without errors
- ✅ All features working in dev environment
- ✅ Git repository clean and committed
- ✅ README and documentation updated

**Deployment:**
- ✅ Cloudflare API token configured
- ✅ Project created in Cloudflare Pages
- ✅ Successful build and deploy
- ✅ Production URL accessible
- ✅ All features working in production

**Post-Deployment:**
- ✅ Verify all tabs and features
- ✅ Test on multiple devices/browsers
- ✅ Monitor logs for errors
- ✅ Set up alerts (optional)
- ✅ Document production URL

## 📞 Support Resources

- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages
- **Wrangler CLI Docs**: https://developers.cloudflare.com/workers/wrangler
- **Hono Framework**: https://hono.dev
- **Project Issues**: See README.md for contact info

## 🎯 Quick Commands Reference

```bash
# Build
npm run build

# Deploy
npm run deploy:prod

# Check status
npx wrangler whoami
npx wrangler pages project list

# View logs
npx wrangler pages deployment tail --project-name webapp

# Add domain
npx wrangler pages domain add yourdomain.com --project-name webapp

# Add secret
npx wrangler pages secret put SECRET_NAME --project-name webapp
```

---

**Last Updated:** December 26, 2024

**Deployment Platform:** Cloudflare Pages

**Build Tool:** Vite 6.4.1

**Runtime:** Cloudflare Workers
