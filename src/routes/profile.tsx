import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout, PageHeader } from "@/components/layout/DashboardLayout";
import { Card, Chip } from "@/components/ui-kit";
import { Mail, Phone, MapPin, Link as LinkIcon, Award, Briefcase, Edit3, ShieldCheck } from "lucide-react";
import { activities } from "@/lib/mock-data";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Netflix Show Manager" },
      { name: "description", content: "Your studio profile, portfolio and achievements." },
    ],
  }),
  component: Profile,
});

function Profile() {
  return (
    <DashboardLayout>
      <PageHeader title="Profile" description="Your studio identity and portfolio." />

      <Card className="!p-0 overflow-hidden mb-6">
        <div className="h-40 relative" style={{ background: "var(--gradient-hero), linear-gradient(135deg, #E50914, #4a0d10)" }}>
          <img src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600&auto=format" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-luminosity" />
        </div>
        <div className="px-6 md:px-8 pb-6 relative">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-4 -mt-12">
            <img src="https://i.pravatar.cc/200?img=13" alt="" className="h-24 w-24 rounded-2xl ring-4 ring-background object-cover shrink-0" />
            <div className="min-w-0 pb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold truncate">Ren Ito</h2>
                <Chip variant="primary"><ShieldCheck className="h-3 w-3" /> Verified</Chip>
              </div>
              <div className="text-sm text-muted-foreground">Administrator · Netflix Studios · Tokyo</div>
            </div>
            <button className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition shrink-0">
              <Edit3 className="h-4 w-4" /> Edit
            </button>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <Row icon={Mail}>ren.ito@netflix.com</Row>
            <Row icon={Phone}>+81 90 1234 5678</Row>
            <Row icon={MapPin}>Tokyo, Japan</Row>
            <Row icon={LinkIcon}>studios.netflix.com/ren</Row>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="text-sm font-semibold mb-4">Activity timeline</div>
          <ol className="relative border-l border-border pl-6 space-y-5">
            {activities.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20" />
                <div className="text-sm">
                  <span className="font-medium">You</span>
                  <span className="text-muted-foreground"> {a.action} </span>
                  <span className="font-medium">{a.target}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{a.time}</div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="text-sm font-semibold mb-4 flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Achievements</div>
            <div className="grid grid-cols-3 gap-3">
              {["Green-lit 50 shows", "5yr veteran", "Top reviewer 2025", "$1B milestone", "Global reach", "Trusted"].map((label, i) => (
                <div key={i} className="rounded-xl border border-border p-3 text-center card-hover">
                  <div className="text-2xl">🏆</div>
                  <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{label}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold mb-4 flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Experience</div>
            <ul className="space-y-3 text-sm">
              <li>
                <div className="font-medium">Head of Studios (APAC)</div>
                <div className="text-xs text-muted-foreground">Netflix · 2022 – Present</div>
              </li>
              <li>
                <div className="font-medium">VP, Content Strategy</div>
                <div className="text-xs text-muted-foreground">Sony Pictures · 2018 – 2022</div>
              </li>
              <li>
                <div className="font-medium">Producer</div>
                <div className="text-xs text-muted-foreground">Studio Ghibli · 2013 – 2018</div>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Row({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="truncate">{children}</span>
    </div>
  );
}
