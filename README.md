# Atlas

Personal work OS: yearly objectives → milestones → tasks, Eisenhower prioritization with a manual Today focus list, and a narrative journal linked to tasks.

All data stays in **this browser** (`localStorage`). PIN is a UI gate only (not encryption).

## Live

https://mustin-jetz.github.io/atlas/

## Run locally

```bash
cd atlas
npm install
npm run dev
```

## Build / GitHub Pages

Pushes to `main` deploy via `.github/workflows/deploy-pages.yml`.

```bash
npm run build
```

`vite.config.ts` sets `base: '/atlas/'` so assets resolve on the project Pages URL.

## v1 features

- Fiscal year objectives (default **FY27** ending **2027-04-24**, configurable)
- Milestones with progress from linked task completion
- Tasks: open / in progress / done; urgency & importance 1–4
- Eisenhower matrix (Do / Schedule / Delegate / Eliminate)
- Manual Today focus list
- Journal (title, body, date) with many-to-many task links
- Full-text search
- In-app “needs attention” badge
- JSON export/import + CSV export
