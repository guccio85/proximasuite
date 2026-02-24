# 🚀 SNEP SMART - Cloud Migration Guide

## Overview

SNEP SMART is now migrated to use **Supabase** as a cloud backend, enabling:
- ✅ Internet-wide access (no more LAN-only limitations)
- ✅ Real-time multi-browser/device synchronization
- ✅ Cloud PostgreSQL database (replacing local database.json)
- ✅ Mobile worker access via QR code to cloud URL
- ✅ Scalable, production-ready architecture

---

## 📋 Migration Checklist

### Step 1: Create Supabase Database Tables ⚙️

1. Log into [Supabase Dashboard](https://app.supabase.com)
2. Navigate to your project: `https://app.supabase.com/project/rutbuafxlptyajbmxgyr`
3. Go to **SQL Editor** (left sidebar)
4. Click **"+ New Query"**
5. Copy the entire contents of `supabase_schema.sql` from this project
6. Paste into the SQL Editor
7. Click **"Run"** or press `Ctrl+Enter`
8. Verify all 8 tables were created:
   - ✅ work_orders
   - ✅ workers
   - ✅ company_settings
   - ✅ availabilities
   - ✅ recurring_absences
   - ✅ global_days
   - ✅ work_logs
   - ✅ time_logs

### Step 2: Migrate Existing Data 📦

If you have existing data in `database.json`, migrate it to Supabase:

```bash
node migrate-to-supabase.js
```

This will:
- Read all data from `database.json`
- Upload to Supabase tables
- Show progress with success/error counts
- Preserve all orders, workers, settings, availabilities, etc.

**Note**: The migration script requires Node.js. Make sure you've run `npm install` first.

### Step 3: Update Cloud URL for Mobile QR 📱

The QR code now points to a cloud URL instead of localhost. Update the cloud URL in [components/Sidebar.tsx](components/Sidebar.tsx):

```typescript
// Line ~38
const CLOUD_BASE_URL = 'https://your-deployed-app.com'; // Replace with your actual frontend URL
```

**Options for deployment**:
- **Vercel**: `https://your-app.vercel.app`
- **Netlify**: `https://your-app.netlify.app`
- **Custom Domain**: `https://proximasuite.app`

### Step 4: Deploy Frontend to Cloud ☁️

To make the mobile QR code work, deploy your frontend:

#### Option A: Vercel (Recommended)

```bash
npm install -g vercel
vercel deploy
```

#### Option B: Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### Option C: Build and Host Manually

```bash
npm run build
# Upload the 'dist' folder to your hosting provider
```

### Step 5: Test Everything ✅

1. **Local Development**: Run `npm run dev` - should connect to Supabase
2. **Multi-Browser Sync**: Open app in Chrome and Edge - changes should sync within 4 seconds
3. **Mobile QR**: Scan QR code from another device - should load mobile interface
4. **CRUD Operations**: 
   - Create new order → verify in Supabase dashboard
   - Edit order → verify update
   - Add worker → verify in workers table
   - Delete worker → verify deletion
5. **Auto-Save**: Wait 30 minutes and verify data persists

### Step 6: Deprecate Local Backend 🗑️

Once everything works with Supabase, remove the old local backend:

```bash
# Rename server.js to mark as deprecated
mv server.js server.js.OLD

# Or delete entirely
rm server.js
```

Update `package.json` to remove any references to `server.js` in scripts.

---

## 🔧 Development

### Run Locally (with Supabase Cloud Backend)

```bash
npm install
npm run dev
```

The app will:
- Run on `http://localhost:3000`
- Connect to Supabase cloud database
- Sync data every 4 seconds
- Auto-save every 30 minutes

### Environment Variables

The Supabase credentials are currently hardcoded in `supabaseClient.ts`. For production, move them to `.env.local`:

```env
VITE_SUPABASE_URL=https://rutbuafxlptyajbmxgyr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dGJ1YWZ4bHB0eWFqYm14Z3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzcwMzIsImV4cCI6MjA4NzQ1MzAzMn0.C3J8Kn_tQKHPs80Y3Qid_wi6RTdaAZXAR2ySwl7iG0Q
```

Then update [supabaseClient.ts](supabaseClient.ts):

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

---

## 📁 Architecture Changes

### Before (Local Backend)
```
Frontend (Vite + React)
   ↓ fetch localhost:3001/api/data
Backend (Express server.js)
   ↓ read/write
Database (database.json)
```

### After (Supabase Cloud)
```
Frontend (Vite + React)
   ↓ supabaseAPI.ts
Supabase Client (@supabase/supabase-js)
   ↓ HTTPS REST API
Supabase Cloud (PostgreSQL + Auth)
```

### Key Files

- **supabaseClient.ts**: Supabase client initialization and type definitions
- **supabaseAPI.ts**: Complete API wrapper with 20+ functions (fetchAllOrders, saveWorker, etc.)
- **supabase_schema.sql**: Database schema (8 tables with JSONB columns)
- **migrate-to-supabase.js**: Data migration script
- **App.tsx**: Main app now uses `SupabaseAPI.*` functions instead of fetch()

---

## 🔒 Security Notes

### Row Level Security (RLS)

Currently, RLS policies are **permissive** (allow all) for testing. For production:

1. Enable Supabase Auth
2. Update RLS policies to check `auth.uid()`
3. Example secure policy:

```sql
CREATE POLICY "Users can only see their company's orders"
ON work_orders
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM company_members WHERE company_id = work_orders.company_id
  )
);
```

### API Key Security

The `anon` key in `supabaseClient.ts` is safe to expose in frontend code. However:
- Never expose the `service_role` key
- Use RLS policies to restrict data access
- Implement Supabase Auth for user management

---

## 🐛 Troubleshooting

### "Failed to fetch from Supabase"

- Check internet connection
- Verify supabase_schema.sql was executed
- Check Supabase project is active (not paused)
- Verify URL and anon key in supabaseClient.ts

### "Migration script fails"

- Ensure Node.js is installed
- Run `npm install` first
- Check database.json exists and is valid JSON
- Verify Supabase tables exist (see Step 1)

### "Multi-browser sync not working"

- Check browser console for errors
- Verify 4-second sync interval in App.tsx (line ~280)
- Ensure both browsers are connected to internet
- Check Supabase dashboard for API errors

### "QR code doesn't load mobile view"

- Verify frontend is deployed to cloud (Step 4)
- Update CLOUD_BASE_URL in Sidebar.tsx (Step 3)
- Check mobile device has internet connection
- Verify Supabase connection from mobile browser

---

## 📊 Database Schema

### work_orders
- `id` (UUID, primary key)
- `order_number` (TEXT)
- `status` (TEXT)
- `scheduled_date` (DATE, indexed)
- `data` (JSONB) - Full order object

### workers
- `id` (UUID, primary key)
- `name` (TEXT, unique, indexed)
- `password` (TEXT)
- `contact_data` (JSONB) - Photo, email, phone, address

### company_settings
- `id` (INTEGER, always 1)
- `data` (JSONB) - All company settings

### availabilities
- `id` (UUID, primary key)
- `worker` (TEXT, indexed)
- `date` (DATE, indexed)
- `available` (BOOLEAN)
- `absence_type` (TEXT)

### recurring_absences
- Planned absence patterns

### global_days
- Company-wide holidays/ADV days

### work_logs
- Worker time logs per order

### time_logs
- Detailed time tracking

---

## 🎯 Next Steps

1. ✅ Run `supabase_schema.sql` in Supabase SQL Editor
2. ✅ Run `node migrate-to-supabase.js` to migrate data
3. ✅ Deploy frontend to Vercel/Netlify
4. ✅ Update `CLOUD_BASE_URL` in Sidebar.tsx
5. ✅ Test everything (CRUD, sync, mobile)
6. ✅ Remove `server.js` once confirmed working
7. 🔜 Implement Supabase Auth for secure login
8. 🔜 Tighten RLS policies for production
9. 🔜 Add custom domain for mobile access

---

## 📞 Support

For issues or questions:
1. Check console logs (browser DevTools)
2. Check Supabase logs (Dashboard → Logs)
3. Review this README
4. Check supabaseAPI.ts for available functions

---

**Version**: 2.3.1 (Supabase Cloud Edition)
**Last Updated**: 2024
