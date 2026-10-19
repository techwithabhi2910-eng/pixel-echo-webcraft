# FinSight AI

Hackathon MVP for the **ERP Olympics** challenge: Finance Automation + Artificial Intelligence + Complete Audit Trail.

## Problem
Manual invoice processing lets duplicates and outliers slip through, and makes it hard to prove who approved what, and when.

## Solution
FinSight AI captures invoices, scores each one with **transparent rule-based (AI-assisted) risk analysis**, routes it through an approval workflow, and logs every step in an exportable audit trail.

## Features
- **Dashboard** – total invoices, pending approvals, flagged transactions, approved spend, recent activity, spending-by-category chart (sample data is labelled).
- **Invoice Management** – search + filter by status, risk and category.
- **Add Invoice** – validated form with PDF/image attachment (file name recorded; no OCR).
- **Risk Analysis** – duplicate IDs (+50), amount ≥ $50,000 (+30), >3× category average (+20), missing fields (+10 each), future date (+15), round amount (+10), weekend date (+5), no document (+5). High ≥ 50, Medium ≥ 25.
- **Approval Workflow** – approve, reject (note required), or reset to pending.
- **Audit Trail** – creation, validation, risk analysis, approvals, rejections, resets; CSV export.

## Architecture
- React 19 + TypeScript + Vite, TanStack Router (file-based routes in `src/routes`), Tailwind CSS v4, Lucide icons.
- `src/lib/finsight.ts` – types, sample data, pure `analyzeRisk()` rules engine, localStorage store (`useSyncExternalStore`), audit logging and CSV export.
- `src/components/fs.tsx` – app shell (sidebar) and shared UI.
- No backend, no API keys, no external services.

## Run
```bash
npm install
npm run dev     # start dev server
npm run build   # production build
npx vitest run  # risk-rule tests
```

## Demo walkthrough
1. Open Dashboard – sample invoices load on first visit.
2. Risk Analysis – see duplicate `INV-1001` and the $72,000 consulting outlier.
3. Add Invoice – reuse `INV-1004`; it is flagged instantly.
4. Approvals – approve or reject (rejection requires a note); dashboard updates.
5. Audit Trail – review events and download the CSV report. "Reset demo data" restores samples.

## Limitations
- Risk scoring is rule-based, **not** a trained ML model.
- No OCR – uploaded files are not parsed.
- Data is stored in browser localStorage; the audit log is **not tamper-proof** or enterprise-secure.
- Single demo user; no authentication or real ERP integrations.

## License
MIT – see `LICENSE`.
