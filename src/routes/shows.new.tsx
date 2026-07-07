import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout, PageHeader } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui-kit";
import { Check, UploadCloud, FileText, ImageIcon, ArrowRight, ArrowLeft, PartyPopper } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/shows/new")({
  head: () => ({
    meta: [
      { title: "Submit a Show — Netflix Show Manager" },
      { name: "description", content: "Submit a new original show for evaluation and production." },
    ],
  }),
  component: NewShow,
});

const steps = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Production" },
  { id: 3, label: "Assets" },
  { id: 4, label: "Review" },
];

function NewShow() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] grid place-items-center">
          <Card className="max-w-lg text-center py-12">
            <div className="mx-auto h-16 w-16 grid place-items-center rounded-2xl bg-success/15 text-success mb-6 animate-pulse-glow">
              <PartyPopper className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold">Submission received</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Your pitch has entered the evaluation queue. You'll be notified as soon as it enters review.
            </p>
            <div className="mt-8 flex justify-center gap-2">
              <Link to="/shows" className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center hover:bg-accent transition">Back to shows</Link>
              <Link to="/dashboard" className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center hover:opacity-90 transition">Dashboard</Link>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader title="Submit a Show" description="Share your vision. Our content team will review within 5 business days." />

      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
        <Card className="h-fit sticky top-24">
          <ol className="space-y-4">
            {steps.map((s) => {
              const active = s.id === step;
              const complete = s.id < step;
              return (
                <li key={s.id} className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full grid place-items-center text-xs font-bold shrink-0
                    ${complete ? "bg-success text-success-foreground" : active ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]" : "bg-muted text-muted-foreground"}`}>
                    {complete ? <Check className="h-4 w-4" /> : s.id}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${active ? "" : "text-muted-foreground"}`}>{s.label}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Step {s.id}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        <Card>
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
          {step === 4 && <Step4 />}

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition shadow-[var(--shadow-glow)]"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={() => setDone(true)} className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition shadow-[var(--shadow-glow)]">
                Submit for review
              </button>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}
function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}
const inputCls = "w-full h-11 px-3.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition";

function Step1() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic Information</h3>
      <Row>
        <Fld label="Title"><input className={inputCls} defaultValue="Nightfall Protocol" /></Fld>
        <Fld label="Genre">
          <select className={inputCls}>
            <option>Drama</option><option>Thriller</option><option>Sci-Fi</option><option>Comedy</option>
          </select>
        </Fld>
        <Fld label="Language"><input className={inputCls} defaultValue="English" /></Fld>
        <Fld label="Target audience"><input className={inputCls} defaultValue="18-49" /></Fld>
        <Fld label="Episodes"><input type="number" className={inputCls} defaultValue={10} /></Fld>
        <Fld label="Runtime (min/ep)"><input type="number" className={inputCls} defaultValue={48} /></Fld>
      </Row>
      <Fld label="Logline & synopsis">
        <textarea rows={5} className={`${inputCls.replace("h-11", "min-h-32 py-3")}`} defaultValue="A rogue algorithm awakens overnight and threatens to expose every secret in the city — a young analyst has 72 hours to stop it." />
      </Fld>
    </div>
  );
}

function Step2() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Budget & Timeline</h3>
      <Row>
        <Fld label="Estimated budget (USD)"><input className={inputCls} defaultValue="$12,500,000" /></Fld>
        <Fld label="Expected ROI"><input className={inputCls} defaultValue="2.4x" /></Fld>
        <Fld label="Start date"><input type="date" className={inputCls} defaultValue="2026-09-01" /></Fld>
        <Fld label="Expected release"><input type="date" className={inputCls} defaultValue="2027-04-15" /></Fld>
        <Fld label="Production location"><input className={inputCls} defaultValue="Seoul · Vancouver" /></Fld>
        <Fld label="Team size"><input type="number" className={inputCls} defaultValue={48} /></Fld>
      </Row>
      <Fld label="Production notes">
        <textarea rows={4} className={`${inputCls.replace("h-11", "min-h-24 py-3")}`} defaultValue="Practical effects preferred. On-location shoots for exterior scenes; VFX outsourced to studio partners." />
      </Fld>
    </div>
  );
}

function Step3() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Upload Assets</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { label: "Poster art", desc: "PNG, JPG · up to 20MB", icon: ImageIcon, file: "poster_final_v3.jpg" },
          { label: "Pitch deck", desc: "PDF · up to 40MB", icon: FileText, file: "nightfall_pitch.pdf" },
          { label: "Script (Ep. 1)", desc: "PDF, FDX · up to 20MB", icon: FileText, file: "s1e1_script.pdf" },
          { label: "Additional documents", desc: "Any format", icon: FileText, file: null },
        ].map((slot) => (
          <div key={slot.label} className="rounded-2xl border border-dashed border-border p-5 hover:border-primary/50 hover:bg-primary/5 transition cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <slot.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{slot.label}</div>
                <div className="text-xs text-muted-foreground">{slot.desc}</div>
                {slot.file && (
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <Check className="h-3.5 w-3.5 text-success" />
                    <span className="truncate">{slot.file}</span>
                  </div>
                )}
              </div>
              <UploadCloud className="h-5 w-5 text-muted-foreground shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step4() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Review submission</h3>
      <div className="rounded-2xl border border-border divide-y divide-border">
        {[
          ["Title", "Nightfall Protocol"],
          ["Genre / Language", "Drama · English"],
          ["Episodes", "10 × 48 min"],
          ["Estimated budget", "$12.5M"],
          ["Expected release", "April 15, 2027"],
          ["Assets", "3 files attached"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between p-4 text-sm">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-medium">{v}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        By submitting, you confirm the information is accurate. Your submission will be routed to Content Managers for evaluation.
      </p>
    </div>
  );
}
