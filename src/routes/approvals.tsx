import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader, StatusBadge, RiskBadge, Empty, btn } from "@/components/fs";
import { actions, analyzeRisk, fmtMoney, useStore, type Status } from "@/lib/finsight";

export const Route = createFileRoute("/approvals")({
  head: () => ({
    meta: [
      { title: "Approvals — FinSight AI" },
      { name: "description", content: "Approve, reject or reset invoices with decision notes." },
      { property: "og:title", content: "Approval Workflow — FinSight AI" },
      { property: "og:description", content: "Invoice approval workflow with required rejection notes." },
    ],
  }),
  component: Approvals,
});

function Approvals() {
  const { invoices } = useStore();
  const [tab, setTab] = useState<Status>("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [rejecting, setRejecting] = useState<string | null>(null);
  const list = invoices.filter((i) => i.status === tab);

  function decide(id: string, status: Status, num: string) {
    try {
      actions.setStatus(id, status, notes[id]);
      setRejecting(null); setNotes({ ...notes, [id]: "" });
      toast.success(`${num} marked ${status}`);
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <AppShell>
      <PageHeader title="Approval Workflow" subtitle="Review invoices. Rejections require a decision note." />
      <div className="mb-4 inline-flex rounded-lg border bg-card p-1">
        {(["pending", "approved", "rejected"] as Status[]).map((s) => (
          <button key={s} onClick={() => setTab(s)} className={`rounded-md px-4 py-1.5 text-sm font-semibold capitalize ${tab === s ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {s} ({invoices.filter((i) => i.status === s).length})
          </button>
        ))}
      </div>
      <div className="card-surface divide-y">
        {list.length === 0 ? <Empty title={`No ${tab} invoices`}>{tab === "pending" ? "You're all caught up." : "Nothing here yet."}</Empty> : list.map((i) => {
          const r = analyzeRisk(i, invoices);
          return (
            <div key={i.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold">{i.vendor} <span className="font-mono text-sm text-muted-foreground">{i.number}</span></div>
                  <div className="text-sm text-muted-foreground">{i.date} · {i.category} · <span className="font-mono">{fmtMoney(i.amount)}</span></div>
                  {i.decisionNote && <div className="mt-1 text-sm">Note: <i>{i.decisionNote}</i></div>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={i.status} /><RiskBadge severity={r.severity} score={r.score} />
                  {i.status !== "approved" && <button className={btn.success} onClick={() => decide(i.id, "approved", i.number)}><Check className="h-3.5 w-3.5" />Approve</button>}
                  {i.status !== "rejected" && <button className={btn.danger} onClick={() => setRejecting(rejecting === i.id ? null : i.id)}><X className="h-3.5 w-3.5" />Reject</button>}
                  {i.status !== "pending" && <button className={btn.ghost} onClick={() => decide(i.id, "pending", i.number)}><RotateCcw className="h-3.5 w-3.5" />Mark pending</button>}
                </div>
              </div>
              {rejecting === i.id && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input autoFocus className="field" placeholder="Reason for rejection (required)" value={notes[i.id] ?? ""} onChange={(e) => setNotes({ ...notes, [i.id]: e.target.value })} />
                  <button className={btn.danger} onClick={() => decide(i.id, "rejected", i.number)}>Confirm reject</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
