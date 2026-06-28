# 🏠 FlagHouse

**Houses → Briefs → Logs → Flags**  
Your internal agency ops tool. Track clients, log work, raise flags, ship things.

---

## Stack

- **Next.js 14** (App Router)
- **Prisma** ORM
- **Vercel Postgres** (Neon serverless)
- **Tailwind CSS** with neumorphic design
- Zero auth

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Vercel Postgres

1. Push your repo to GitHub
2. Create a new Vercel project and import it
3. Go to **Storage** tab → **Create Database** → **Postgres**
4. Click **Connect** on your project
5. Go to **.env.local** tab and copy the env vars

Create a `.env.local` in the root:

```env
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."
```

### 3. Push schema to database

```bash
npm run db:push
```

This creates all tables. You're ready.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

Once your Postgres is connected to the Vercel project, the env vars are automatically available.  
Deployments run `prisma generate` before `next build` (see `package.json` build script).

```bash
git push origin main  # Vercel auto-deploys
```

---

## Data Model

```
House        — a client / account
  └── Brief  — a project or engagement under a house
        └── Log — an activity entry
              (isFlag = false) → plain log
              (isFlag = true)  → Brief Flag (task with deadline + description)

OpenFlag     — standalone task, not tied to any house or brief
              has priority: LOW | MID | HIGH
```

---

## Features

- **Houses** — create and manage clients
- **Briefs** — projects under each house
- **Logs** — activity entries per brief (timestamped)
- **Raise Flag** — convert any log → a brief flag (adds deadline + description)
- **Add Flag directly** — create a flag without a log entry first
- **Open Flags** — standalone tasks with priority (Low / Mid / High)
- **Complete flags** — check off any flag
- **Dark mode** — auto-switches at 6:30 PM → 6:30 AM, with manual override toggle

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run db:push` | Sync schema → database (no migration file) |
| `npm run db:migrate` | Create a named migration |
| `npm run db:studio` | Open Prisma Studio GUI |
