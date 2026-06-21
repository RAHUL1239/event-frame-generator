# Event Frame Generator

Multi-event profile frame and poster generator — inspired by the [BMM 2026 badge generator](https://bmm2026-badge-generator.vercel.app/attendee).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App (Vercel)                    │
├─────────────────────────────────────────────────────────────┤
│  Public Routes              │  Admin Routes                 │
│  /events/[slug]/personal    │  /admin                       │
│  /events/[slug]/group       │  /admin/events/[id]           │
│  /events/[slug]/preview/:id │  /admin/login                 │
├─────────────────────────────────────────────────────────────┤
│  API Routes                                                 │
│  /api/events/[slug]           → Event config (public)       │
│  /api/events/[slug]/submissions → Submit + audit log       │
│  /api/admin/*                 → Protected admin CRUD        │
├─────────────────────────────────────────────────────────────┤
│  Client-side Canvas           │  Prisma + SQLite/Postgres   │
│  (photo never stored)         │  (metadata + audit only)    │
└─────────────────────────────────────────────────────────────┘
```

### Multi-event design

- Each event has a unique **slug** (`/events/mkm-51st-gauravshali-sohla/personal`)
- Event config is database-driven: name, dates, tagline, colors, gender options
- Add new events via admin without code changes
- Swap SQLite (dev) → PostgreSQL (production) by changing `DATABASE_URL`

### Privacy model

- Photos are composited **in the browser** via Canvas API
- Server stores only **metadata**: filename, size, timestamp, IP — not image bytes
- Generated PNGs stored as data URLs for preview/download (can move to ephemeral storage later)

## MKM 51st Gauravshali Sohla (seeded)

- **Event:** MKM 51st Gauravshali Sohla
- **Dates:** July 17th & 18th, 2026
- **Tagline:** सोहळा कौतुकाचा, सन्मान ज्येष्ठांचा, उत्साह नव्या पिढीचा…

## Quick Start

```bash
cd ~/BMMApp
cp .env.example .env
npm install

# Start local Postgres (requires Docker)
docker compose up -d

npx prisma db push
npm run db:seed
npm run dev
```

**No Docker?** Create a free database at [Neon](https://neon.tech), paste the connection string into `DATABASE_URL` in `.env`, then run `db push` and `db:seed`.

Open:
- http://localhost:3000 — event list
- http://localhost:3000/events/mkm-51st-gauravshali-sohla/personal — personal DP
- http://localhost:3000/admin — admin dashboard

Default admin: `admin@example.com` / `changeme`

## Deployment (Vercel + Postgres)

1. Push to GitHub
2. Import in Vercel
3. Add env vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
4. Use Neon or Supabase for PostgreSQL
5. Run `npx prisma db push && npm run db:seed` against production DB

## Future expansion

- Upload custom poster/DP template PNGs per event (admin)
- S3/R2 for temporary file processing if server-side rendering needed
- OAuth for admin (Google/GitHub)
- Per-event analytics dashboard
- QR code on poster template
