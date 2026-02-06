# High School Portal

Next.js front-end that displays lesson videos from Hygraph.

## Setup

```bash
npm install
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_HYGRAPH_URL=https://api-us-west-2.hygraph.com/v2/cm65g7pxd09kx07my82376f33/master
# NEXT_PUBLIC_HYGRAPH_TOKEN=optional for public content
```

## Run

```bash
npm run dev
```

Open http://localhost:3000/lessons

## Data source

Fetches `MediaItem` entries with `type: VIDEO` and `videoUrl` (YouTube embed) from Hygraph. Add entries via Hygraph Studio or the GDrive→YouTube script + manual Hygraph create.
