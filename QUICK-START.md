# ⚡ Kurye Paneli - Quick Start

## For Deployment to Production

### 1️⃣ Supabase Setup (5 min)
```bash
# 1. Go to supabase.com → Create Project → Select Frankfurt
# 2. Note your database password
# 3. Wait for initialization
```

### 2️⃣ Database Schema (2 min)
```sql
-- In Supabase SQL Editor:
-- Copy entire sema.sql file and run it
-- You should see "Success" message
```

### 3️⃣ Get Your Credentials (2 min)
```
Go to: Project Settings → API
Copy:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 4️⃣ Create Admin User (2 min)
```sql
-- In Supabase Authentication → Add user
-- Remember to check "Auto Confirm User"
-- Then run this in SQL Editor:

insert into profiller (id, ad, rol)
values ('YOUR-USER-ID', 'Your Name', 'yonetici');
```

### 5️⃣ Test Locally (5 min)
```bash
# Create .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ..." >> .env.local

# Run the app
npm run dev

# Visit http://localhost:3000
```

### 6️⃣ Deploy to Vercel (5 min)
```bash
# Push to GitHub
git remote add origin <your-github-url>
git push -u origin main

# Then on vercel.com:
# 1. Import from Git
# 2. Add the same 2 environment variables
# 3. Click Deploy
```

## ✨ That's it! You're live! 🚀

**Total time: ~20 minutes**
**Total cost: FREE** 💰

---

## For Users (Couriers/Store Owners)

Share this URL with them:
```
https://your-app.vercel.app/giris
```

They can:
1. Open in browser
2. Login with their credentials
3. Tap "Add to Home Screen" on mobile
4. Use like a native app

## Features Available

### 🏪 Store Owners Can:
- Create orders
- Set delivery addresses
- Track status in real-time
- See daily reports

### 🚚 Couriers Can:
- See available orders (pool)
- Accept delivery jobs
- Update status
- Track earnings

### 👔 Admin Can:
- Manage stores
- Manage users
- Invite couriers
- View analytics

## Environment Variables

Required for `.env.local` and Vercel:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Support

- 📖 Full guide: See DEPLOYMENT-STATUS.md
- ❓ Questions: Check README.md
- 🐛 Issues: See troubleshooting in DEPLOYMENT-STATUS.md

---

**Questions?** You're all set! Deploy now! 🚀
