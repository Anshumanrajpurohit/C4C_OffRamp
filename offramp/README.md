This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Plant-search engine integration

The `/swap` experience now talks to the FastAPI project that lives in `c4c/plant-search`. To use the live recommendations:

1. From `c4c/plant-search` start the API (for example `uvicorn api.main:app --reload`).
2. Copy `.env.example` to `.env.local` and set both `PLANT_SEARCH_API_BASE_URL` **and** `NEXT_PUBLIC_PLANT_SEARCH_API_BASE_URL` to the FastAPI origin (default `http://localhost:8000`).
3. Restart the Next.js dev server so the new environment variables are picked up.

The `/services/plantSearchService.ts` module centralizes all FastAPI calls (search, health, dish listing, etc.) and is consumed directly by `/app/swap/page.tsx`. There is no longer a legacy fallback: every swap and recommendation comes straight from the Plant-Based Transition Engine, so keep that backend running whenever you work on the swap experience.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
