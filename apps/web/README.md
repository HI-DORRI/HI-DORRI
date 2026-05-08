# HI-DORRI Web

HI-DORRI frontend app. This package is the canonical frontend location in the monorepo.

## Getting Started

Run from the repository root:

```bash
npm install
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

Frontend source lives in:

```text
apps/web/app
apps/web/components
```

The old top-level `frontend` folder has been removed to avoid two frontend sources drifting apart.

## Useful Commands

```bash
npm run dev:web
npm run build --workspace @hi-dorri/web
npm run lint --workspace @hi-dorri/web
npm run typecheck --workspace @hi-dorri/web
```

## API Integration

API calls are intentionally not wired yet. The backend API base will be added later through `NEXT_PUBLIC_API_BASE_URL`.
