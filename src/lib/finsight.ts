import { useSyncExternalStore } from "react";

export type Status = "pending" | "approved" | "rejected";
export type Severity = "low" | "medium" | "high";

export interface Invoice {
  id: string;
  number: string;
  vendor: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: string;
  description: string;
  status: Status;
  attachment?: string;
  decisionNote?: string;
  createdAt: string;
  sample?: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  type: string;
  invoiceRef: string;
  outcome: string;
}

export interface RiskResult {
  score: number;
  severity: Severity;
  reasons: { rule: string; detail: string; points: number }[];
}

export const CATEGORIES = ["Software", "Office Supplies", "Travel", "Consulting", "Utilities", "Marketing", "Hardware"];
export const HIGH_AMOUNT_THRESHOLD = 50000;
export const ACTOR = "Demo User (Finance)";

/** Transparent, rule-based risk scoring. Pure function — no model, no network. */
export function analyzeRisk(inv: Invoice, all: Invoice[]): RiskResult {
  const reasons: RiskResult["reasons"] = [];
  const dupes = all.filter((o) => o.id !== inv.id && o.number.trim().toLowerCase() === inv.number.trim().toLowerCase());
  if (dupes.length) reasons.push({ rule: "Duplicate invoice ID", detail: `Invoice number ${inv.number} also used by ${dupes.map((d) => d.vendor).join(", ")}`, points: 50 });

  if (inv.amount >= HIGH_AMOUNT_THRESHOLD) {
    reasons.push({ rule: "Unusually high amount", detail: `Amount ≥ ${fmtMoney(HIGH_AMOUNT_THRESHOLD)} threshold`, points: 30 });
  } else {
    const peers = all.filter((o) => o.id !== inv.id && o.category === inv.category);
    if (peers.length >= 2) {
      const avg = peers.reduce((s, p) => s + p.amount, 0) / peers.length;
      if (inv.amount > avg * 3) reasons.push({ rule: "Outlier vs. category", detail: `${(inv.amount / avg).toFixed(1)}× the ${inv.category} average of ${fmtMoney(avg)}`, points: 20 });
    }
  }

  const missing = (["vendor", "number", "date", "category", "description"] as const).filter((k) => !String(inv[k] ?? "").trim());
  if (!(inv.amount > 0)) missing.push("amount" as never);
  if (missing.length) reasons.push({ rule: "Missing fields", detail: `Missing: ${missing.join(", ")}`, points: 10 * missing.length });

  if (inv.amount >= 1000 && inv.amount % 1000 === 0) reasons.push({ rule: "Round-number amount", detail: "Exact multiple of 1,000 — common in fabricated invoices", points: 10 });
  if (inv.date) {
    const d = new Date(inv.date + "T00:00:00");
    const day = d.getDay();
    if (day === 0 || day === 6) reasons.push({ rule: "Weekend invoice date", detail: "Dated on a Saturday or Sunday", points: 5 });
    if (inv.date > new Date().toISOString().slice(0, 10)) reasons.push({ rule: "Future-dated invoice", detail: `Date ${inv.date} is in the future`, points: 15 });
  }
  if (!inv.attachment && !inv.sample) reasons.push({ rule: "No supporting document", detail: "No PDF/image attached", points: 5 });

  const score = Math.min(100, reasons.reduce((s, r) => s + r.points, 0));
  return { score, severity: score >= 50 ? "high" : score >= 25 ? "medium" : "low", reasons };
}

export function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

// ---------- Sample data ----------
function seed(): { invoices: Invoice[]; audit: AuditEvent[] } {
  const rows: [string, string, string, number, string, string, Status][] = [
    ["Acme Cloud Services", "INV-1001", "2026-09-02", 4200, "Software", "Monthly cloud hosting", "approved"],
    ["Northwind Office Co.", "INV-1002", "2026-09-05", 860, "Office Supplies", "Paper, toner, stationery", "approved"],
    ["Skyline Travel", "INV-1003", "2026-09-09", 3150, "Travel", "Team offsite flights", "pending"],
    ["Vertex Consulting LLP", "INV-1004", "2026-09-12", 72000, "Consulting", "ERP migration advisory", "pending"],
    ["PowerGrid Utilities", "INV-1005", "2026-09-15", 1275, "Utilities", "Electricity — September", "approved"],
    ["BrightAds Media", "INV-1006", "2026-09-19", 5000, "Marketing", "", "pending"],
    ["Acme Cloud Services", "INV-1001", "2026-09-22", 4200, "Software", "Monthly cloud hosting", "pending"],
    ["Helix Hardware", "INV-1008", "2026-09-26", 2380, "Hardware", "Laptops x2", "rejected"],
    ["Northwind Office Co.", "INV-1009", "2026-10-03", 640, "Office Supplies", "Ergonomic chairs", "approved"],
    ["Skyline Travel", "INV-1010", "2026-10-07", 1890, "Travel", "Client visit — hotel", "approved"],
  ];
  const invoices = rows.map(([vendor, number, date, amount, category, description, status], i) => ({
    id: `s${i + 1}`, vendor, number, date, amount, category, description, status, sample: true,
    createdAt: `${date}T09:00:00.000Z`,
    decisionNote: status === "rejected" ? "Not on approved vendor list" : undefined,
  }));
  const audit: AuditEvent[] = invoices.map((inv, i) => ({
    id: `a${i + 1}`, timestamp: inv.createdAt, actor: "System (sample data)", type: "INVOICE_CREATED", invoiceRef: inv.number, outcome: "Sample invoice loaded",
  }));
  return { invoices, audit };
}

// ---------- Store (localStorage) ----------
const KEY = "finsight-ai-v1";
type State = { invoices: Invoice[]; audit: AuditEvent[] };
const EMPTY: State = { invoices: [], audit: [] };
let state: State | null = null;
const listeners = new Set<() => void>();

function load(): State {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? JSON.parse(raw) : seed();
  } catch {
    state = seed();
  }
  if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, JSON.stringify(state));
  return state!;
}
function save(next: State) {
  state = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
function event(type: string, invoiceRef: string, outcome: string): AuditEvent {
  return { id: uid(), timestamp: new Date().toISOString(), actor: ACTOR, type, invoiceRef, outcome };
}

export function useStore(): State {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    load,
    () => EMPTY,
  );
}

export const actions = {
  addInvoice(data: Omit<Invoice, "id" | "status" | "createdAt">) {
    const s = load();
    const inv: Invoice = { ...data, id: uid(), status: "pending", createdAt: new Date().toISOString() };
    const all = [inv, ...s.invoices];
    const risk = analyzeRisk(inv, all);
    const evts = [
      event("INVOICE_CREATED", inv.number, `Created for ${inv.vendor}, ${fmtMoney(inv.amount)}${inv.attachment ? ` (document: ${inv.attachment})` : ""}`),
      event("VALIDATION", inv.number, "Form validation passed"),
      event("RISK_ANALYSIS", inv.number, `Score ${risk.score} (${risk.severity})${risk.reasons.length ? ": " + risk.reasons.map((r) => r.rule).join("; ") : ""}`),
    ];
    save({ invoices: all, audit: [...evts.reverse(), ...s.audit] });
    return { inv, risk };
  },
  setStatus(id: string, status: Status, note?: string) {
    const s = load();
    const inv = s.invoices.find((i) => i.id === id);
    if (!inv) return;
    if (status === "rejected" && !note?.trim()) throw new Error("A decision note is required to reject an invoice.");
    const type = status === "approved" ? "APPROVED" : status === "rejected" ? "REJECTED" : "STATUS_RESET";
    save({
      invoices: s.invoices.map((i) => (i.id === id ? { ...i, status, decisionNote: note?.trim() || undefined } : i)),
      audit: [event(type, inv.number, `${inv.status} → ${status}${note?.trim() ? ` — "${note.trim()}"` : ""}`), ...s.audit],
    });
  },
  logRiskReview(count: number) {
    const s = load();
    save({ ...s, audit: [event("RISK_ANALYSIS", "ALL", `Batch risk analysis run on ${count} invoices`), ...s.audit] });
  },
  reset() {
    save({ ...seed(), audit: [event("DATA_RESET", "ALL", "Demo data restored to sample set"), ...seed().audit] });
  },
};

export function auditCsv(events: AuditEvent[]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return ["Timestamp,Actor,Event Type,Invoice Ref,Outcome", ...events.map((e) => [e.timestamp, e.actor, e.type, e.invoiceRef, e.outcome].map(esc).join(","))].join("\n");
}
