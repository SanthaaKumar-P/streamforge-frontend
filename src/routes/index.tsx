import { createFileRoute, Link } from "@tanstack/react-router";
import { Clapperboard, ArrowRight, ShieldCheck, BarChart3, Kanban, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-hero)" }} />

      <header className="relative z-10 h-16 px-6 md:px-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 grid place-items-center rounded-xl bg-primary shadow-[var(--shadow-glow)]">
            <Clapperboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-wide">NETFLIX</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Show Manager</div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#workflow" className="hover:text-foreground transition">Workflow</a>
          <a href="#roles" className="hover:text-foreground transition">Roles</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:inline-flex h-10 px-4 items-center rounded-xl text-sm hover:bg-accent transition">Sign in</Link>
          <Link to="/dashboard" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition">
            Launch Console <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="relative z-10 px-6 md:px-10 pt-16 md:pt-24 pb-20 max-w-7xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 backdrop-blur px-3 py-1 text-xs text-muted-foreground mb-6">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Internal platform · v3.4
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl">
          The command center for <span className="gradient-text">Netflix Originals</span>.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
          Submit pitches, evaluate content, manage productions, and unlock analytics — from a single, cinematic workspace built for producers, directors and creators.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/dashboard" className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition shadow-[var(--shadow-glow)]">
            Open Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/shows/new" className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl border border-border hover:bg-accent transition">
            Submit a show
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active productions", value: "28" },
            { label: "Shows approved (YTD)", value: "132" },
            { label: "Countries", value: "42" },
            { label: "Uptime", value: "99.98%" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl glass p-5">
              <div className="text-3xl md:text-4xl font-bold gradient-text">{s.value}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="relative z-10 px-6 md:px-10 pb-24 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Kanban, title: "Production Kanban", body: "Track every show from planning to post-production with drag-and-drop workflows." },
            { icon: BarChart3, title: "Executive Analytics", body: "Revenue, genre performance, and approval velocity in real time." },
            { icon: ShieldCheck, title: "Enterprise Security", body: "SSO, 2FA, granular RBAC, and immutable audit logs across the platform." },
          ].map((f) => (
            <div key={f.title} className="rounded-3xl border border-border p-6 card-hover" style={{ background: "var(--gradient-card)" }}>
              <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <div className="text-lg font-semibold">{f.title}</div>
              <p className="text-sm text-muted-foreground mt-2">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border px-6 md:px-10 py-8 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3">
        <div>© {new Date().getFullYear()} Netflix Studios — Internal use only.</div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Security</a>
          <a href="#" className="hover:text-foreground">Support</a>
        </div>
      </footer>
    </div>
  );
}
