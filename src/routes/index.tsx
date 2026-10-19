import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Clock, AlertTriangle, DollarSign } from "lucide-react";
import { useMemo } from "react";
import { AppShell, PageHeader, Empty } from "@/components/fs";
import { analyzeRisk, fmtMoney, useStore } from "@/lib/finsight";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — FinSight AI" },
      { name: "description", content: "Finance automation dashboard with invoice risk scoring, approvals and a full audit trail." },
      { property: "og:title", content: "FinSight AI — Finance Automation Dashboard" },
      { property: "og:description", content: "Invoice processing, explainable risk analysis, approvals and audit trail." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { invoices, audit } = useStore();
  const stats = useMemo(() => {
    const flagged = invoices.filter((i) => analyzeRisk(i, invoices).severity !== "low").length;
    const processed = invoices.filter((i) => i.status === "approved").reduce((s, i) => s + i.amount, 0);
    const byCat: Record<string, number> = {};
    invoices.forEach((i) => (byCat[i.category || "Uncategorized"] = (byCat[i.category || "Uncategorized"] ?? 0) + i.amount));
    return { flagged, processed, pending: invoices.filter((i) => i.status === "pending").length, byCat: Object.entries(byCat).sort((a, b) => b[1] - a[1]) };
  }, [invoices]);
  const max = Math.max(1, ...stats.byCat.map((c) => c[1]));
  const hasSample = invoices.some((i) => i.sample);

  const cards = [
    { label: "Total invoices", value: invoices.length, icon: FileText, tone: "text-primary bg-accent" },
    { label: "Pending approvals", value: stats.pending, icon: Clock, tone: "text-foreground bg-warning/20" },
    { label: "Flagged transactions", value: stats.flagged, icon: AlertTriangle, tone: "text-destructive bg-destructive/10" },
    { label: "Processed (approved)", value: fmtMoney(stats.processed), icon: DollarSign, tone: "text-success bg-success/15" },
  ];

  return (
    <AppShell>
      <PageHeader title="Dashboard" subtitle="Overview of invoice processing, risk and approvals."
        action={hasSample && <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">Includes sample / demo data</span>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card-surface p-5">
            <div className={`mb-3 inline-flex rounded-lg p-2 ${c.tone}`}><c.icon className="h-5 w-5" /></div>
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-sm text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="card-surface p-5 lg:col-span-3">
          <h2 className="mb-4 font-semibold">Spending by category</h2>
          {stats.byCat.length === 0 ? <Empty title="No invoices yet" /> : (
            <div className="space-y-3">
              {stats.byCat.map(([cat, amt]) => (
                <div key={cat}>
                  <div className="mb-1 flex justify-between text-sm"><span>{cat}</span><span className="font-mono">{fmtMoney(amt)}</span></div>
                  <div className="h-2.5 rounded-full bg-muted"><div className="bg-brand h-full rounded-full" style={{ width: `${(amt / max) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="card-surface p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Recent activity</h2><Link to="/audit" className="text-sm font-medium text-primary">View all</Link></div>
          {audit.length === 0 ? <Empty title="No activity yet" /> : (
            <ul className="space-y-3">
              {audit.slice(0, 6).map((e) => (
                <li key={e.id} className="border-l-2 border-primary pl-3 text-sm">
                  <div className="font-medium">{e.type.replace(/_/g, " ")} · <span className="font-mono">{e.invoiceRef}</span></div>
                  <div className="truncate text-muted-foreground">{e.outcome}</div>
                  <div className="text-xs text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
