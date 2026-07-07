import { createFileRoute, Link } from "@tanstack/react-router";
import { Clapperboard, Eye, EyeOff, Github } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [show, setShow] = useState(false);
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="relative hidden lg:block overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600&auto=format"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, oklch(0.14 0 0 / 0.6), oklch(0.14 0 0 / 0.9))" }} />
        <div className="relative z-10 h-full flex flex-col justify-between p-12">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 grid place-items-center rounded-xl bg-primary shadow-[var(--shadow-glow)]">
              <Clapperboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-wide">NETFLIX</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Show Manager</div>
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-bold max-w-md leading-tight">The stage is set. Ready when you are.</h2>
            <p className="text-muted-foreground mt-4 max-w-md">
              Producers, directors and creators use Show Manager to move every original from concept to screen.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-9 w-9 grid place-items-center rounded-xl bg-primary"><Clapperboard className="h-5 w-5" /></div>
            <div className="text-sm font-bold">NETFLIX SHOW MANAGER</div>
          </div>

          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-2">Sign in to your studio workspace.</p>

          <div className="mt-8 space-y-4">
            <button className="w-full h-11 rounded-xl border border-border hover:bg-accent transition flex items-center justify-center gap-2 text-sm">
              <Github className="h-4 w-4" /> Continue with SSO
            </button>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> or with email <div className="h-px flex-1 bg-border" />
            </div>

            <Field label="Work email">
              <input type="email" defaultValue="ren.ito@netflix.com" className="input" />
            </Field>
            <Field label="Password" trailing={<Link to="/login" className="text-xs text-primary hover:underline">Forgot?</Link>}>
              <div className="relative">
                <input type={show ? "text" : "password"} defaultValue="••••••••••" className="input pr-10" />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" className="accent-primary" defaultChecked /> Keep me signed in on this device
            </label>

            <Link to="/dashboard" className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition flex items-center justify-center shadow-[var(--shadow-glow)]">
              Sign in
            </Link>

            <p className="text-xs text-center text-muted-foreground">
              Don't have an account? <Link to="/register" className="text-primary hover:underline">Request access</Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`.input{width:100%;height:44px;padding:0 14px;border-radius:12px;background:var(--surface);border:1px solid var(--border);color:inherit;font-size:14px;outline:none;transition:border-color .2s, box-shadow .2s}.input:focus{border-color:transparent;box-shadow:0 0 0 2px var(--ring)}`}</style>
    </div>
  );
}

function Field({ label, trailing, children }: { label: string; trailing?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {trailing}
      </div>
      {children}
    </label>
  );
}
