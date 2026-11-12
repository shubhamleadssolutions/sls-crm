# Shubham Leads Solutions (SLS) - Enterprise CRM
## Direct Production Deployment Guide

This codebase is 100% production-ready. You can deploy it immediately to **Vercel**, **Railway**, **Render**, or any **VPS/Cloud Server** connected to your Supabase PostgreSQL database.

---

### 1. Zero-Config Deployment on Vercel (Recommended)

1. Push this repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "SLS Enterprise CRM - Production Ready"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/sls-crm.git
   git push -u origin main
   ```
2. Go to [Vercel Dashboard](https://vercel.com/new) and click **"Import Project"**.
3. Select this repository.
4. In the **Environment Variables** section, add the following 3 variables:
   - `DATABASE_URL`: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres` (Your Supabase PostgreSQL connection string)
   - `JWT_SECRET`: `sls-crm-enterprise-secure-jwt-secret-key-2026-production`
   - `NEXT_PUBLIC_APP_URL`: `https://your-crm-domain.vercel.app`
5. Click **"Deploy"**. Vercel will automatically run `npm run build` (which triggers `prisma generate && next build`) and launch your production CRM.

---

### 2. Deployment on Linux VPS / Ubuntu / Docker

1. Clone and install dependencies:
   ```bash
   git clone <repo-url>
   cd CRM
   npm install
   ```
2. Create your `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   # Edit with your live database URL and JWT secret
   ```
3. Build the production application:
   ```bash
   npm run build
   ```
4. Run continuously using PM2:
   ```bash
   npm install -g pm2
   pm2 start npm --name "sls-crm" -- start
   pm2 save
   pm2 startup
   ```

---

### 3. Production Architecture Highlights
- **Framework:** Next.js 14 App Router with React 18
- **Database ORM:** Prisma Client 5.22 connected directly to Supabase PostgreSQL
- **Security:**
  - HTTP-only session cookies with `SameSite=Lax` and `Secure` flag
  - Enterprise HTTP Security Headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`)
  - Server-side Edge Middleware route protection (`src/middleware.ts`)
  - Automated duplicate record prevention on prospects
- **Custom Branding:**
  - SF Pro Typography throughout the portal
  - Transparent SLS Corporate Logo & Multi-resolution Favicons
  - Custom Branded 404 Not Found & Error Boundary handlers
- **Default Master Admin:**
  - **Username:** `ansh.kumar`
  - **Password:** `ANSH@123`
  - **Designation:** `Managing Director - Acting as Admin`
  - **Role:** `ADMIN` (with full executive privileges & ability to create `CEO` and team accounts)
