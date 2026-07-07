import { createFileRoute, Link } from "@tanstack/react-router";
import { Clapperboard } from "lucide-react";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-hero)" }} />
      <div className="relative z-10 w-full max-w-xl rounded-3xl border border-border p-8 md:p-10" style={{ background: "var(--gradient-card)" }}>
        <div className="flex items-center gap-2 mb-8">
          <div className="h-9 w-9 grid place-items-center rounded-xl bg-primary"><Clapperboard className="h-5 w-5 text-primary-foreground" /></div>
          <div className="text-sm font-bold">NETFLIX SHOW MANAGER</div>
        </div>

        <h1 className="text-3xl font-bold">Request access</h1>
        <p className="text-sm text-muted-foreground mt-2">Available to Netflix staff and approved partners.</p>

        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          <F label="First name" v="Ren" />
          <F label="Last name" v="Ito" />
          <F label="Work email" v="ren.ito@netflix.com" className="sm:col-span-2" />
          <F label="Role" v="Administrator" />
          <F label="Department" v="Studios" />
          <F label="Password" v="••••••••" type="password" />
          <F label="Confirm password" v="••••••••" type="password" />
        </div>

        <label className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" defaultChecked className="mt-0.5 accent-primary" />
          I agree to the Studios Acceptable Use Policy and understand access is subject to approval.
        </label>

        <Link to="/dashboard" className="mt-6 w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition flex items-center justify-center shadow-[var(--shadow-glow)]">
          Create account
        </Link>

        <p className="mt-4 text-xs text-center text-muted-foreground">
          Already have access? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
      <style>{`.input{width:100%;height:44px;padding:0 14px;border-radius:12px;background:var(--surface);border:1px solid var(--border);color:inherit;font-size:14px;outline:none}.input:focus{box-shadow:0 0 0 2px var(--ring);border-color:transparent}`}</style>
    </div>
  );
}

function F({ label, v, type = "text", className = "" }: { label: string; v: string; type?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <input defaultValue={v} type={type} className="input" />
    </label>
  );
}
