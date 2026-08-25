import { createFileRoute } from "@tanstack/react-router";
import {
  DashboardLayout,
  PageHeader,
} from "@/components/layout/DashboardLayout";
import { Card, Chip } from "@/components/ui-kit";
import {
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  Award,
  Briefcase,
  Edit3,
  ShieldCheck,
  User,
  Building2,
  Save,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { activities } from "@/lib/mock-data";
import {
  getUserById,
  updateUser,
  type User as ApiUser,
  type UpdateUserRequest,
} from "@/api/UserApi";
import { getCurrentUserId } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      {
        title: "Profile — Netflix Show Manager",
      },
      {
        name: "description",
        content:
          "Your studio profile, portfolio and achievements.",
      },
    ],
  }),
  component: Profile,
});

function Profile() {
  const [user, setUser] = useState<ApiUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    employeeCode: "",
    bio: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  /**
   * Load logged-in user's profile
   */
  async function loadProfile() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const userId = getCurrentUserId();

      if (!userId) {
        throw new Error(
          "User session not found. Please login again."
        );
      }

      const data = await getUserById(userId);

      setUser(data);

      setForm({
        fullName: data.fullName ?? "",
        username: data.username ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        employeeCode: data.employeeCode ?? "",
        bio: data.bio ?? "",
      });

      /*
       * Keep local storage synchronized with
       * the latest backend user information.
       */
      const storage = localStorage.getItem(
        "streamforge_token"
      )
        ? localStorage
        : sessionStorage;

      storage.setItem(
        "streamforge_user",
        JSON.stringify(data)
      );

      if (data.userId !== undefined) {
        storage.setItem(
          "streamforge_user_id",
          String(data.userId)
        );
      }

      if (data.username) {
        storage.setItem(
          "streamforge_username",
          data.username
        );
      }

      if (data.email) {
        storage.setItem(
          "streamforge_email",
          data.email
        );
      }

      const roleName = getRoleName(data);

      if (roleName) {
        storage.setItem(
          "streamforge_role",
          roleName
        );
      }
    } catch (err) {
      console.error(
        "Failed to load profile:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load profile."
      );
    } finally {
      setLoading(false);
    }
  }

  /**
   * Start editing
   */
  function handleEdit() {
    if (!user) return;

    setError("");
    setSuccess("");

    setForm({
      fullName: user.fullName ?? "",
      username: user.username ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      employeeCode: user.employeeCode ?? "",
      bio: user.bio ?? "",
    });

    setIsEditing(true);
  }

  /**
   * Cancel editing
   */
  function handleCancel() {
    if (user) {
      setForm({
        fullName: user.fullName ?? "",
        username: user.username ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        employeeCode: user.employeeCode ?? "",
        bio: user.bio ?? "",
      });
    }

    setError("");
    setIsEditing(false);
  }

  /**
   * Save profile
   */
  async function handleSave() {
    if (!user) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const userId = getCurrentUserId();

      if (!userId) {
        throw new Error(
          "User session not found. Please login again."
        );
      }

      if (!form.fullName.trim()) {
        throw new Error(
          "Full name is required."
        );
      }

      if (!form.username.trim()) {
        throw new Error(
          "Username is required."
        );
      }

      if (!form.email.trim()) {
        throw new Error(
          "Email is required."
        );
      }

      const request: UpdateUserRequest = {
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        employeeCode:
          form.employeeCode.trim() || undefined,
        bio: form.bio.trim() || undefined,

        /*
         * Keep the existing role.
         * We don't allow normal users to change
         * their own role from Profile.
         */
        roleId:
          typeof user.role === "object"
            ? user.role?.roleId
            : undefined,
      };

      const updatedUser = await updateUser(
        userId,
        request
      );

      setUser(updatedUser);

      setForm({
        fullName: updatedUser.fullName ?? "",
        username: updatedUser.username ?? "",
        email: updatedUser.email ?? "",
        phone: updatedUser.phone ?? "",
        employeeCode:
          updatedUser.employeeCode ?? "",
        bio: updatedUser.bio ?? "",
      });

      /*
       * Synchronize local session data.
       */
      const storage = localStorage.getItem(
        "streamforge_token"
      )
        ? localStorage
        : sessionStorage;

      storage.setItem(
        "streamforge_user",
        JSON.stringify(updatedUser)
      );

      if (updatedUser.userId !== undefined) {
        storage.setItem(
          "streamforge_user_id",
          String(updatedUser.userId)
        );
      }

      if (updatedUser.username) {
        storage.setItem(
          "streamforge_username",
          updatedUser.username
        );
      }

      if (updatedUser.email) {
        storage.setItem(
          "streamforge_email",
          updatedUser.email
        );
      }

      setIsEditing(false);

      setSuccess(
        "Profile updated successfully."
      );
    } catch (err) {
      console.error(
        "Failed to update profile:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  /**
   * Loading state
   */
  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Profile"
          description="Your studio identity and portfolio."
        />

        <div className="min-h-[500px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />

            <span className="text-sm">
              Loading your profile...
            </span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /**
   * Error state
   */
  if (error && !user) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Profile"
          description="Your studio identity and portfolio."
        />

        <Card className="border-red-500/30 bg-red-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />

            <div>
              <div className="font-semibold text-red-400">
                Unable to load profile
              </div>

              <p className="text-sm text-muted-foreground mt-1">
                {error}
              </p>

              <button
                onClick={loadProfile}
                className="mt-4 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
              >
                Try again
              </button>
            </div>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  const roleName = getRoleName(user);

  return (
    <DashboardLayout>
      <PageHeader
        title="Profile"
        description="Your studio identity and portfolio."
      />

      {/* =====================================================
          SUCCESS / ERROR MESSAGES
          ===================================================== */}

      {success && (
        <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {success}
        </div>
      )}

      {error && user && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* =====================================================
          PROFILE HEADER
          ===================================================== */}

      <Card className="!p-0 overflow-hidden mb-6">

        {/* Cover */}

        <div
          className="h-40 relative"
          style={{
            background:
              "var(--gradient-hero), linear-gradient(135deg, #E50914, #4a0d10)",
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600&auto=format"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-luminosity"
          />
        </div>

        {/* Profile content */}

        <div className="px-6 md:px-8 pb-6 relative">

          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-4 -mt-12">

            {/* Avatar */}

            <div className="relative shrink-0">

              <img
                src="https://i.pravatar.cc/200?img=13"
                alt={user.fullName || "User"}
                className="h-24 w-24 rounded-2xl ring-4 ring-background object-cover"
              />

              <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-primary grid place-items-center ring-4 ring-background">
                <ShieldCheck className="h-4 w-4 text-primary-foreground" />
              </div>

            </div>

            {/* Name / Role */}

            <div className="min-w-0 pb-2">

              <div className="flex items-center gap-2 flex-wrap">

                <h2 className="text-2xl font-bold truncate">
                  {user.fullName}
                </h2>

                <Chip variant="primary">
                  <ShieldCheck className="h-3 w-3" />

                  Verified
                </Chip>

              </div>

              <div className="text-sm text-muted-foreground mt-1">
                {formatRole(roleName)}
              </div>

              <div className="text-xs text-muted-foreground mt-1">
                @{user.username}
              </div>

            </div>

            {/* Edit / Save */}

            {!isEditing ? (
              <button
                type="button"
                onClick={handleEdit}
                className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition shrink-0"
              >
                <Edit3 className="h-4 w-4" />

                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition disabled:opacity-50"
                >
                  <X className="h-4 w-4" />

                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}

                  {saving ? "Saving..." : "Save"}
                </button>

              </div>
            )}

          </div>


          {/* =================================================
              PROFILE INFORMATION
              ================================================= */}

          {!isEditing ? (
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">

              <Row icon={Mail}>
                {user.email || "No email"}
              </Row>

              <Row icon={Phone}>
                {user.phone || "No phone"}
              </Row>

              <Row icon={MapPin}>
                StreamForge Studio
              </Row>

              <Row icon={LinkIcon}>
                @{user.username}
              </Row>

            </div>
          ) : (
            <div className="mt-6 grid md:grid-cols-2 gap-4">

              <ProfileInput
                label="Full name"
                value={form.fullName}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    fullName: value,
                  }))
                }
              />

              <ProfileInput
                label="Username"
                value={form.username}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    username: value,
                  }))
                }
              />

              <ProfileInput
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    email: value,
                  }))
                }
              />

              <ProfileInput
                label="Phone"
                value={form.phone}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    phone: value,
                  }))
                }
              />

              <ProfileInput
                label="Employee code"
                value={form.employeeCode}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    employeeCode: value,
                  }))
                }
              />

              <div>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Role
                  </span>

                  <div className="mt-1.5 h-11 px-3 flex items-center rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground">
                    {formatRole(roleName)}
                  </div>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Bio
                  </span>

                  <textarea
                    value={form.bio}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        bio: event.target.value,
                      }))
                    }
                    maxLength={500}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-primary/40"
                  />

                  <div className="text-[11px] text-muted-foreground text-right mt-1">
                    {form.bio.length}/500
                  </div>
                </label>
              </div>

            </div>
          )}

        </div>
      </Card>


      {/* =====================================================
          LOWER CONTENT
          ===================================================== */}

      <div className="grid lg:grid-cols-3 gap-4">

        {/* Activity */}

        <Card className="lg:col-span-2">

          <div className="text-sm font-semibold mb-4">
            Activity timeline
          </div>

          <ol className="relative border-l border-border pl-6 space-y-5">

            {activities.map((a) => (
              <li
                key={a.id}
                className="relative"
              >

                <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20" />

                <div className="text-sm">

                  <span className="font-medium">
                    You
                  </span>

                  <span className="text-muted-foreground">
                    {" "}
                    {a.action}{" "}
                  </span>

                  <span className="font-medium">
                    {a.target}
                  </span>

                </div>

                <div className="text-xs text-muted-foreground mt-0.5">
                  {a.time}
                </div>

              </li>
            ))}

          </ol>

        </Card>


        {/* Right column */}

        <div className="space-y-4">

          {/* Achievements */}

          <Card>

            <div className="text-sm font-semibold mb-4 flex items-center gap-2">

              <Award className="h-4 w-4 text-primary" />

              Achievements

            </div>

            <div className="grid grid-cols-3 gap-3">

              {[
                "Green-lit 50 shows",
                "5yr veteran",
                "Top reviewer 2025",
                "$1B milestone",
                "Global reach",
                "Trusted",
              ].map((label, i) => (

                <div
                  key={i}
                  className="rounded-xl border border-border p-3 text-center card-hover"
                >

                  <div className="text-2xl">
                    🏆
                  </div>

                  <div className="text-[10px] text-muted-foreground mt-1 leading-tight">
                    {label}
                  </div>

                </div>

              ))}

            </div>

          </Card>


          {/* Experience */}

          <Card>

            <div className="text-sm font-semibold mb-4 flex items-center gap-2">

              <Briefcase className="h-4 w-4 text-primary" />

              Experience

            </div>

            <ul className="space-y-3 text-sm">

              <li>

                <div className="font-medium">
                  StreamForge Studio
                </div>

                <div className="text-xs text-muted-foreground">
                  {formatRole(roleName)} · Current
                </div>

              </li>

              <li>

                <div className="font-medium">
                  Content & Production
                </div>

                <div className="text-xs text-muted-foreground">
                  StreamForge · Professional Workspace
                </div>

              </li>

              <li>

                <div className="font-medium">
                  Employee Code
                </div>

                <div className="text-xs text-muted-foreground">
                  {user.employeeCode || "Not assigned"}
                </div>

              </li>

            </ul>

          </Card>

        </div>

      </div>


      {/* =====================================================
          BACKEND DATA CARD
          ===================================================== */}

      <Card className="mt-4">

        <div className="text-sm font-semibold mb-4 flex items-center gap-2">

          <User className="h-4 w-4 text-primary" />

          Account Information

        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <InfoItem
            label="User ID"
            value={String(user.userId)}
          />

          <InfoItem
            label="Username"
            value={user.username}
          />

          <InfoItem
            label="Role"
            value={formatRole(roleName)}
          />

          <InfoItem
            label="Status"
            value={
              user.isActive === false
                ? "Inactive"
                : "Active"
            }
          />

        </div>

        {user.bio && (
          <div className="mt-5 pt-5 border-t border-border">

            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Bio
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {user.bio}
            </p>

          </div>
        )}

      </Card>

    </DashboardLayout>
  );
}


/* ============================================================
   HELPER COMPONENTS
   ============================================================ */

function Row({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">

      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />

      <span className="truncate">
        {children}
      </span>

    </div>
  );
}


function ProfileInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">

      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-1.5 w-full h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />

    </label>
  );
}


function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border p-3">

      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>

      <div className="text-sm font-medium mt-1 truncate">
        {value || "—"}
      </div>

    </div>
  );
}


/* ============================================================
   ROLE HELPERS
   ============================================================ */

function getRoleName(user: ApiUser): string {
  if (typeof user.role === "string") {
    return user.role;
  }

  return user.role?.roleName ?? "";
}


function formatRole(role: string): string {
  if (!role) {
    return "Studio Member";
  }

  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}