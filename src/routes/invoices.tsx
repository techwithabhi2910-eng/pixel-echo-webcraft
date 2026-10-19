import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, PageHeader, StatusBadge, RiskBadge, Empty, btn } from "@/components/fs";
import { analyzeRisk, fmtMoney, useStore, CATEGORIES } from "@/lib/finsight";

export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [
      { title: "Invoices — FinSight AI" },
      { name: "description", content: "Search and filter invoices by vendor, status and risk level." },
      { property: "og:title", content: "Invoice Management — FinSight AI" },
      { property: "og:description", content: "Searchable, filterable invoice table with risk levels." },
    ],
  }),
  component: Invoices,
});

function Invoices() {
  const { invoices } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [risk, setRisk] = useState("all");
  const [cat, setCat] = useState("all");
  const rows = useMemo(() => invoices
    .map((i) => ({ ...i, risk: analyzeRisk(i, invoices) }))
    .filter((i) => (status === "all" || i.status === status) && (risk === "all" || i.risk.severity === risk) && (cat === "all" || i.category === cat))
    .filter((i) => !q || `${i.vendor} ${i.number} ${i.description}`.toLowerCase().includes(q.toLowerCase())),
  [invoices, q, status, risk, cat]);

  return (
    <AppShell>
      <PageHeader title="Invoice Management" subtitle={`${rows.length} of ${invoices.length} invoices`} action={<Link to="/add-invoice" className={btn.primary}>Add invoice</Link>} />
      <div className="card-surface">
        <div className="grid gap-3 border-b p-4 md:grid-cols-4">
          <label className="relative md:col-span-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input className="field pl-9" placeholder="Search vendor or ID…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          </label>
          <select className="field" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
            <option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
          </select>
          <select className="field" value={risk} onChange={(e) => setRisk(e.target.value)} aria-label="Risk filter">
            <option value="all">All risk levels</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
          <select className="field" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category filter">
            <option value="all">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        {rows.length === 0 ? <Empty title="No invoices match">Try clearing your search or filters.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-4 py-3">Vendor</th><th className="px-4 py-3">Invoice ID</th><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Risk</th></tr>
              </thead>
              <tbody>
                {rows.map((i) => (
                  <tr key={i.id} className="border-t hover:bg-muted/40">
                    <td className="px-4 py-3"><div className="font-medium">{i.vendor}</div><div className="text-xs text-muted-foreground">{i.category}{i.sample && " · sample"}</div></td>
                    <td className="px-4 py-3 font-mono">{i.number}</td>
                    <td className="px-4 py-3">{i.date}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmtMoney(i.amount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                    <td className="px-4 py-3"><RiskBadge severity={i.risk.severity} score={i.risk.score} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
