import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader, RiskBadge, Empty, btn } from "@/components/fs";
import { actions, analyzeRisk, fmtMoney, useStore, HIGH_AMOUNT_THRESHOLD } from "@/lib/finsight";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "Risk Analysis — FinSight AI" },
      { name: "description", content: "Transparent rule-based risk scoring for duplicates, high amounts and missing fields." },
      { property: "og:title", content: "AI-assisted Risk Analysis — FinSight AI" },
      { property: "og:description", content: "Explainable invoice risk scores with exact reasons." },
    ],
  }),
  component: Risk,
});

function Risk() {
  const { invoices } = useStore();
  const [onlyFlagged, setOnlyFlagged] = useState(true);
  const rows = useMemo(() => invoices.map((i) => ({ inv: i, r: analyzeRisk(i, invoices) })).sort((a, b) => b.r.score - a.r.score), [invoices]);
  const shown = onlyFlagged ? rows.filter((x) => x.r.score > 0) : rows;

  return (
    <AppShell>
      <PageHeader title="AI Risk Analysis" subtitle="Rule-based, AI-assisted analysis — every score is fully explained."
        action={<button className={btn.primary} onClick={() => { actions.logRiskReview(invoices.length); toast.success(`Analysis run on ${invoices.length} invoices and logged to audit trail`); }}>Run analysis</button>} />
      <div className="card-surface mb-6 flex gap-3 p-4 text-sm">
        <Info className="h-5 w-5 shrink-0 text-primary" />
        <p className="text-muted-foreground">This is <b className="text-foreground">not a trained machine-learning model</b>. Scores come from transparent local rules: duplicate invoice ID (+50), amount ≥ {fmtMoney(HIGH_AMOUNT_THRESHOLD)} (+30), &gt;3× category average (+20), missing fields (+10 each), future date (+15), round amount (+10), weekend date (+5), no attached document (+5). Severity: High ≥ 50, Medium ≥ 25.</p>
      </div>
      <label className="mb-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyFlagged} onChange={(e) => setOnlyFlagged(e.target.checked)} /> Show only invoices with triggered rules</label>
      {shown.length === 0 ? <div className="card-surface"><Empty title="No risks detected">All invoices passed every rule.</Empty></div> : (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map(({ inv, r }) => (
            <div key={inv.id} className="card-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div><div className="font-semibold">{inv.vendor}</div><div className="font-mono text-xs text-muted-foreground">{inv.number} · {inv.date} · {fmtMoney(inv.amount)}</div></div>
                <RiskBadge severity={r.severity} />
              </div>
              <div className="my-3 flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-muted"><div className={`h-full rounded-full ${r.severity === "high" ? "bg-destructive" : r.severity === "medium" ? "bg-warning" : "bg-success"}`} style={{ width: `${r.score}%` }} /></div>
                <span className="font-mono text-sm font-bold">{r.score}/100</span>
              </div>
              {r.reasons.length ? (
                <ul className="space-y-1.5 text-sm">{r.reasons.map((x) => <li key={x.rule} className="flex gap-2"><span className="font-mono text-xs text-destructive">+{x.points}</span><span><b>{x.rule}:</b> <span className="text-muted-foreground">{x.detail}</span></span></li>)}</ul>
              ) : <p className="text-sm text-muted-foreground">No rules triggered.</p>}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
