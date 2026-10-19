import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/fs";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — FinSight AI" },
      { name: "description", content: "Problem, solution, features, limitations and how to run FinSight AI." },
      { property: "og:title", content: "About FinSight AI" },
      { property: "og:description", content: "ERP Olympics MVP: finance automation, AI-assisted risk, audit trail." },
    ],
  }),
  component: About,
});

const S = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="card-surface p-6"><h2 className="mb-3 text-lg font-semibold">{title}</h2><div className="space-y-2 text-sm text-muted-foreground">{children}</div></section>
);

function About() {
  return (
    <AppShell>
      <PageHeader title="About FinSight AI" subtitle="ERP Olympics — Finance Automation + AI + Complete Audit Trail" />
      <div className="grid gap-6 md:grid-cols-2">
        <S title="The problem"><p>Finance teams process invoices by hand, miss duplicates and outliers, and struggle to prove who approved what and when during audits.</p></S>
        <S title="The solution"><p>FinSight AI captures invoices, scores each one with explainable risk rules, routes it through an approval workflow, and records every step in an exportable audit trail.</p></S>
        <S title="Features"><ul className="list-disc space-y-1 pl-5">
          <li>Live dashboard with counts, approved spend and category chart</li>
          <li>Searchable, filterable invoice table</li>
          <li>Validated invoice form with PDF/image attachment</li>
          <li>Rule-based risk scoring with exact reasons</li>
          <li>Approve / reject / reset with required rejection notes</li>
          <li>Audit trail with CSV export</li></ul></S>
        <S title="Limitations"><ul className="list-disc space-y-1 pl-5">
          <li>Risk analysis is rule-based, not a trained AI model.</li>
          <li>No OCR — attached files are not parsed.</li>
          <li>Data lives in browser localStorage; the audit log is not tamper-proof.</li>
          <li>Single demo user, no authentication or ERP integration.</li></ul></S>
        <S title="How to run"><pre className="overflow-x-auto rounded-lg bg-sidebar p-4 font-mono text-xs text-sidebar-foreground">{`npm install\nnpm run dev\nnpm run build`}</pre></S>
        <S title="Demo walkthrough"><ol className="list-decimal space-y-1 pl-5">
          <li>Open the Dashboard — sample invoices load on first visit.</li>
          <li>Risk Analysis shows the duplicate INV-1001 and the $72,000 outlier.</li>
          <li>Add an invoice reusing INV-1004 — watch it flagged instantly.</li>
          <li>Approve or reject it in Approvals (rejection needs a note).</li>
          <li>Open Audit Trail and download the CSV report.</li></ol></S>
      </div>
    </AppShell>
  );
}
