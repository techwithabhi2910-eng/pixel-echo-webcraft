import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader, Empty, btn } from "@/components/fs";
import { actions, auditCsv, useStore } from "@/lib/finsight";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Trail — FinSight AI" },
      { name: "description", content: "Timestamped log of every invoice event, exportable as CSV." },
      { property: "og:title", content: "Audit Trail — FinSight AI" },
      { property: "og:description", content: "Complete invoice event log with CSV export." },
    ],
  }),
  component: Audit,
});

function Audit() {
  const { audit } = useStore();
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");
  const types = useMemo(() => [...new Set(audit.map((e) => e.type))].sort(), [audit]);
  const rows = audit.filter((e) => (type === "all" || e.type === type) && (!q || `${e.invoiceRef} ${e.outcome} ${e.actor}`.toLowerCase().includes(q.toLowerCase())));

  function download() {
    const blob = new Blob([auditCsv(rows)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `finsight-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(`Exported ${rows.length} events`);
  }

  return (
    <AppShell>
      <PageHeader title="Audit Trail" subtitle={`${audit.length} events recorded`}
        action={<div className="flex gap-2">
          <button className={btn.outline} onClick={() => { if (confirm("Restore sample data? Your changes will be lost.")) { actions.reset(); toast.success("Demo data restored"); } }}>Reset demo data</button>
          <button className={btn.primary} onClick={download} disabled={!rows.length}><Download className="h-4 w-4" />Download CSV</button>
        </div>} />
      <div className="card-surface mb-4 flex gap-3 p-4 text-sm">
        <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
        <p className="text-muted-foreground">This log is stored in your browser (localStorage) for demo purposes. It is <b className="text-foreground">not tamper-proof</b> or enterprise-secure; a production system would use an append-only server-side store.</p>
      </div>
      <div className="card-surface">
        <div className="grid gap-3 border-b p-4 sm:grid-cols-2">
          <input className="field" placeholder="Search invoice ref, outcome…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="field" value={type} onChange={(e) => setType(e.target.value)}><option value="all">All event types</option>{types.map((t) => <option key={t}>{t}</option>)}</select>
        </div>
        {rows.length === 0 ? <Empty title="No events found" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-4 py-3">Timestamp</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Event</th><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Outcome</th></tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="border-t align-top">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{new Date(e.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3">{e.actor}</td>
                    <td className="px-4 py-3"><span className="rounded bg-accent px-2 py-0.5 font-mono text-xs text-accent-foreground">{e.type}</span></td>
                    <td className="px-4 py-3 font-mono">{e.invoiceRef}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.outcome}</td>
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
