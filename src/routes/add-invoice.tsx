import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AppShell, PageHeader, RiskBadge, btn } from "@/components/fs";
import { actions, CATEGORIES, type RiskResult } from "@/lib/finsight";

export const Route = createFileRoute("/add-invoice")({
  head: () => ({
    meta: [
      { title: "Add Invoice — FinSight AI" },
      { name: "description", content: "Enter a new invoice with supporting document for automatic risk analysis." },
      { property: "og:title", content: "Add Invoice — FinSight AI" },
      { property: "og:description", content: "Create invoices with validation and instant rule-based risk scoring." },
    ],
  }),
  component: AddInvoice,
});

const empty = { vendor: "", number: "", date: "", amount: "", category: "", description: "" };

function AddInvoice() {
  const [f, setF] = useState(empty);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ number: string; risk: RiskResult } | null>(null);
  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!f.vendor.trim()) err.vendor = "Vendor is required";
    if (!f.number.trim()) err.number = "Invoice number is required";
    if (!f.date) err.date = "Date is required";
    const amt = Number(f.amount);
    if (!f.amount || !(amt > 0)) err.amount = "Enter an amount greater than 0";
    if (!f.category) err.category = "Choose a category";
    if (file && !/^(application\/pdf|image\/)/.test(file.type)) err.file = "Only PDF or image files are allowed";
    if (file && file.size > 10 * 1024 * 1024) err.file = "File must be under 10 MB";
    setErrors(err);
    if (Object.keys(err).length) { setResult(null); return; }
    const { risk } = actions.addInvoice({ vendor: f.vendor.trim(), number: f.number.trim(), date: f.date, amount: amt, category: f.category, description: f.description.trim(), attachment: file?.name });
    setResult({ number: f.number.trim(), risk });
    setF(empty); setFile(null);
  }

  const field = (k: keyof typeof empty, label: string, input: React.ReactNode) => (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {input}
      {errors[k] && <span className="mt-1 block text-xs text-destructive">{errors[k]}</span>}
    </label>
  );

  return (
    <AppShell>
      <PageHeader title="Add Invoice" subtitle="Enter invoice details manually. New invoices start as Pending and are risk-scored instantly." />
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={submit} noValidate className="card-surface grid gap-4 p-6 sm:grid-cols-2 lg:col-span-2">
          {field("vendor", "Vendor *", <input className="field" value={f.vendor} onChange={set("vendor")} placeholder="Acme Cloud Services" />)}
          {field("number", "Invoice number *", <input className="field font-mono" value={f.number} onChange={set("number")} placeholder="INV-2001" />)}
          {field("date", "Invoice date *", <input type="date" className="field" value={f.date} onChange={set("date")} />)}
          {field("amount", "Amount (USD) *", <input type="number" min="0" step="0.01" className="field" value={f.amount} onChange={set("amount")} placeholder="0.00" />)}
          {field("category", "Category *", <select className="field" value={f.category} onChange={set("category")}><option value="">Select…</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>)}
          <div className="sm:col-span-2">{field("description", "Description", <textarea rows={3} className="field" value={f.description} onChange={set("description")} placeholder="What is this invoice for?" />)}</div>
          <div className="sm:col-span-2">
            <span className="mb-1 block text-sm font-medium">Supporting document (PDF / image)</span>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed p-4 text-sm hover:bg-muted/50">
              <Upload className="h-5 w-5 text-primary" />
              <span>{file ? file.name : "Click to attach a file"}</span>
              <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <p className="mt-1 text-xs text-muted-foreground">The file name is recorded for reference only. Automatic text extraction (OCR) is not implemented — please type the details above.</p>
            {errors.file && <span className="mt-1 block text-xs text-destructive">{errors.file}</span>}
          </div>
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" className={btn.primary}>Save & analyze</button>
            <button type="button" className={btn.outline} onClick={() => { setF(empty); setFile(null); setErrors({}); }}>Clear</button>
          </div>
        </form>
        <aside className="space-y-4">
          {Object.keys(errors).length > 0 && (
            <div className="card-surface flex gap-3 border-destructive/40 p-4 text-sm"><AlertCircle className="h-5 w-5 shrink-0 text-destructive" /><div><b>Please fix the highlighted fields.</b></div></div>
          )}
          {result && (
            <div className="card-surface p-5">
              <div className="mb-3 flex items-center gap-2 font-semibold text-success"><CheckCircle2 className="h-5 w-5" /> Invoice {result.number} saved</div>
              <div className="mb-2 flex items-center gap-2 text-sm">Risk: <RiskBadge severity={result.risk.severity} score={result.risk.score} /></div>
              {result.risk.reasons.length ? (
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{result.risk.reasons.map((r) => <li key={r.rule}><b className="text-foreground">{r.rule}</b> (+{r.points}): {r.detail}</li>)}</ul>
              ) : <p className="text-sm text-muted-foreground">No risk rules triggered.</p>}
              <div className="mt-4 flex gap-2"><Link to="/approvals" className={btn.ghost}>Go to approvals</Link><Link to="/invoices" className={btn.ghost}>View invoices</Link></div>
            </div>
          )}
          {!result && !Object.keys(errors).length && (
            <div className="card-surface p-5 text-sm text-muted-foreground">After saving, you'll see the rule-based risk score and the exact reasons here.</div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
