import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FileText, FilePlus2, ShieldAlert, CheckSquare, ScrollText, Info, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Severity, Status } from "@/lib/finsight";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/add-invoice", label: "Add Invoice", icon: FilePlus2 },
  { to: "/risk", label: "Risk Analysis", icon: ShieldAlert },
  { to: "/approvals", label: "Approvals", icon: CheckSquare },
  { to: "/audit", label: "Audit Trail", icon: ScrollText },
  { to: "/about", label: "About", icon: Info },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);
  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => {
        const active = path === n.to;
        return (
          <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
            className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")}>
            <n.icon className="h-4 w-4" /> {n.label}
          </Link>
        );
      })}
    </nav>
  );
  const brand = (
    <div className="flex items-center gap-2 px-2 pb-6">
      <div className="bg-brand flex h-9 w-9 items-center justify-center rounded-lg font-bold text-sidebar-primary-foreground">F</div>
      <div>
        <div className="font-bold text-sidebar-accent-foreground">FinSight AI</div>
        <div className="text-xs text-sidebar-foreground/70">Finance automation</div>
      </div>
    </div>
  );
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar p-4 lg:flex">
        {brand}{nav}
        <p className="mt-auto px-2 text-xs text-sidebar-foreground/60">Browser-only demo · data stored locally</p>
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64 bg-sidebar p-4">
            <button aria-label="Close menu" className="absolute right-3 top-3 text-sidebar-foreground" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            {brand}{nav}
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b bg-card px-4 py-3 lg:hidden">
          <button aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <span className="font-bold">FinSight AI</span>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const cls = { pending: "bg-warning/15 text-foreground", approved: "bg-success/15 text-success", rejected: "bg-destructive/10 text-destructive" }[status];
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", cls)}>{status}</span>;
}

export function RiskBadge({ severity, score }: { severity: Severity; score?: number }) {
  const cls = { low: "bg-success/15 text-success", medium: "bg-warning/20 text-foreground", high: "bg-destructive/10 text-destructive" }[severity];
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", cls)}>{severity}{score !== undefined && ` · ${score}`}</span>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export const btn = {
  primary: "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50",
  outline: "inline-flex items-center justify-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50",
  success: "inline-flex items-center gap-1 rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-success/90",
  danger: "inline-flex items-center gap-1 rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90",
  ghost: "inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-muted",
};
