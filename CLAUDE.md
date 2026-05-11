# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`sfdx-batch-monitor` is a full-stack web app that monitors Salesforce Batch Apex and scheduled Apex jobs. The backend wraps Salesforce CLI (`sf`) commands into REST APIs; the React frontend polls those APIs and displays live-updating tables.

**Prerequisites:** Node.js >= 18 (20+ recommended), Salesforce CLI (`sf`) installed and authenticated to an org.

## Commands

### Development (hot-reloading on both frontend and backend)
```bash
npm run dev
```
This uses `concurrently` to run the Express server and Vite dev server simultaneously. Frontend dev server runs on port 5173, proxying `/api/*` to the Express backend on port 3000.

### Production
```bash
npm run build   # Compiles React client to dist/ (runs from repo root)
npm start       # Serves dist/ via Express on port 3000
```

### Linting
```bash
npm run lint            # Root (Node/Express) ESLint
cd client && npm run lint   # Client (React/TypeScript) ESLint
```

### No test framework is configured — there are no unit/integration tests.

## Architecture

### Backend (`server.js`, `src/`, `config/`)
- **`server.js`**: Express entry point. Serves static `dist/` in production; mounts `/api` routes.
- **`src/routes/api.js`**: Four endpoints:
  - `GET /api/orgs` — lists authenticated SF orgs
  - `GET /api/batch-jobs` — queries `AsyncApexJob` records (supports `targetOrg`, `jobId`, `search`, `statuses`, `limit`)
  - `GET /api/scheduled-jobs` — queries `CronTrigger` records
  - `GET /api/org-limits` — fetches org API limits
- **`src/services/sfCliService.js`**: Executes `sf` CLI commands (`sf org list`, `sf data query`, `sf limits api display`). Includes robust JSON parsing that strips BOM, ANSI codes, and partial output before the real JSON starts.
- **`config/constants.js`**: Shared constants — `PORT` (3000), refresh intervals, SOQL limits, CLI timeout.
- Input validation uses regex on `targetOrg` and `jobId` before passing to CLI.

### Frontend (`client/src/`)
- **`App.tsx`**: Root component — tab navigation (Batch Monitor, Batch Schedule, Org Limits), global controls (org selector, refresh interval, manual refresh), modals.
- **`stores/appStore.ts`**: Zustand store holding all global state: theme, selected org, jobs data, filters, sort state, detail modal state, refresh interval.
- **`features/`**: Feature panels organized by tab:
  - `batch-monitor/` — `BatchMonitorPanel`, `JobsTable`, `StatusFilters`
  - `schedule/` — `SchedulePanel`, `ScheduleTable`
  - `org-limits/` — `OrgLimitsPanel`, `OrgLimitsTable`
  - `modals/` — `DetailModal`, `ScheduleStateHelpModal`
- **`hooks/`**: Custom polling hooks (`useBatchPolling`, `useOrgLimitsPolling`, `useScheduledJobs`, `useOrgs`) that call the API services on an interval driven by Zustand state.
- **`services/api.ts`**: Fetch wrappers for each API endpoint.
- **`utils/`**: Pure utility functions — filtering (`filters.ts`), sorting (`tableSort.ts`), formatting (`format.ts`, `detailRows.ts`), CSV export (`csvExport.ts`), org limits formatting (`orgLimitsUtils.ts`).
- **Theming**: CSS custom properties in `styles/themes.css` (light/dark). Toggle state persisted to `localStorage` via Zustand.
- **`types.ts`**: Shared TypeScript types — `JobRecord`, `Org`, `TabId`, `DetailModalState`, `OrgLimitRow`.

### Build
Vite builds client output to `../dist` (repo root `dist/`), which Express serves in production. The proxy in `client/vite.config.ts` forwards `/api` to `localhost:3000` in dev mode.
