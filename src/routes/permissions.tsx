import { createFileRoute } from "@tanstack/react-router";
import {
  DashboardLayout,
  PageHeader,
} from "@/components/layout/DashboardLayout";
import { Card, Chip } from "@/components/ui-kit";
import {
  PERMISSION_MATRIX,
  ROLES,
  useRole,
  type Role,
} from "@/lib/roles";
import {
  Check,
  Minus,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/permissions")({
  head: () => ({
    meta: [
      {
        title: "Permission Matrix — Netflix Show Manager",
      },
      {
        name: "description",
        content:
          "Role-based access control matrix across guest, viewer, creator, director, producer, content manager and admin.",
      },
      {
        property: "og:title",
        content:
          "Permission Matrix — Netflix Show Manager",
      },
      {
        property: "og:description",
        content:
          "Explore the RBAC permission matrix and simulate any studio role.",
      },
    ],
  }),

  component: PermissionsPage,
});

function PermissionsPage() {
  const {
    role,
    setRole,
    profile,
  } = useRole();

  /*
   * Keep the role order exactly as defined
   * inside roles.ts.
   */
  const order = ROLES.map(
    (r) => r.id
  );

  /*
   * Count the capabilities available
   * for each role.
   *
   * false = not allowed
   * true / string = allowed or conditional
   */
  const allowedCount = (
    selectedRole: Role
  ) => {
    return PERMISSION_MATRIX.filter(
      (row) =>
        row.grants[selectedRole] !== false
    ).length;
  };

  /*
   * Change simulated role.
   *
   * This is frontend-only because there is
   * currently no Permissions backend module.
   */
  const handleRoleChange = (
    selectedRole: Role
  ) => {
    setRole(selectedRole);
  };

  return (
    <DashboardLayout>

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <PageHeader
        title="Permission Matrix"
        description="Live RBAC map. Click any role column to simulate that persona across the entire product."
        actions={
          <Chip variant="primary">
            <ShieldCheck className="h-3 w-3" />
            Active: {profile.label}
          </Chip>
        }
      />

      {/* =====================================================
          ROLE SUMMARY CARDS
      ===================================================== */}

      <div
        className="
          grid
          sm:grid-cols-2
          xl:grid-cols-4
          gap-4
          mb-6
        "
      >
        {ROLES.slice(3).map(
          (selectedRole) => {

            const isActive =
              selectedRole.id === role;

            return (
              <Card
                key={selectedRole.id}
                className={cn(
                  "card-hover",
                  isActive &&
                    "ring-1 ring-primary"
                )}
              >

                {/* ROLE INFO */}

                <div className="flex items-center gap-3">

                  <img
                    src={selectedRole.avatar}
                    alt=""
                    className="
                      h-10
                      w-10
                      rounded-full
                      object-cover
                    "
                  />

                  <div className="min-w-0">

                    <div
                      className="
                        text-sm
                        font-semibold
                        truncate
                      "
                    >
                      {selectedRole.label}
                    </div>

                    <div
                      className="
                        text-xs
                        text-muted-foreground
                        truncate
                      "
                    >
                      {selectedRole.blurb}
                    </div>

                  </div>

                </div>

                {/* CAPABILITY COUNT */}

                <div
                  className="
                    mt-4
                    flex
                    items-baseline
                    gap-2
                  "
                >

                  <span
                    className="
                      text-2xl
                      font-bold
                    "
                  >
                    {allowedCount(
                      selectedRole.id
                    )}
                  </span>

                  <span
                    className="
                      text-xs
                      text-muted-foreground
                    "
                  >
                    / {PERMISSION_MATRIX.length}{" "}
                    capabilities
                  </span>

                </div>

                {/* ACTIVE INDICATOR */}

                {isActive && (
                  <div className="mt-3">
                    <Chip variant="primary">
                      <ShieldCheck className="h-3 w-3" />
                      Active role
                    </Chip>
                  </div>
                )}

              </Card>
            );
          }
        )}
      </div>

      {/* =====================================================
          PERMISSION MATRIX
      ===================================================== */}

      <Card className="!p-0 overflow-hidden">

        {/* MATRIX HEADER */}

        <div
          className="
            p-5
            border-b
            border-border
            flex
            items-center
            justify-between
            gap-3
            flex-wrap
          "
        >

          <div>

            <div
              className="
                text-sm
                font-semibold
              "
            >
              Appendix A · Role-Based Permission Matrix
            </div>

            <div
              className="
                text-xs
                text-muted-foreground
                mt-1
              "
            >
              Enforced in the UI — locked items
              appear disabled in navigation.
            </div>

          </div>

          <Chip variant="info">
            <UserCheck className="h-3 w-3" />
            Click a column header to switch role
          </Chip>

        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div
          className="
            overflow-x-auto
            scrollbar-thin
          "
        >

          <table className="w-full text-sm">

            {/* TABLE HEADER */}

            <thead
              className="
                text-xs
                uppercase
                tracking-wider
                text-muted-foreground
                bg-surface-elevated/40
              "
            >

              <tr>

                <th
                  className="
                    p-4
                    text-left
                    sticky
                    left-0
                    bg-surface-elevated/90
                    backdrop-blur
                    z-10
                    min-w-[220px]
                  "
                >
                  Functionality
                </th>

                {ROLES.map(
                  (selectedRole) => {

                    const isActive =
                      selectedRole.id ===
                      role;

                    return (
                      <th
                        key={
                          selectedRole.id
                        }
                        className="
                          p-3
                          text-center
                          whitespace-nowrap
                        "
                      >

                        <button
                          type="button"
                          onClick={() =>
                            handleRoleChange(
                              selectedRole.id
                            )
                          }
                          aria-pressed={
                            isActive
                          }
                          className={cn(
                            `
                              px-2.5
                              py-1.5
                              rounded-lg
                              transition
                              whitespace-nowrap
                              focus:outline-none
                              focus:ring-2
                              focus:ring-ring
                            `,
                            isActive
                              ? `
                                bg-primary
                                text-primary-foreground
                              `
                              : `
                                hover:bg-accent
                              `
                          )}
                        >
                          {
                            selectedRole.label
                          }
                        </button>

                      </th>
                    );
                  }
                )}

              </tr>

            </thead>

            {/* TABLE BODY */}

            <tbody>

              {PERMISSION_MATRIX.map(
                (row) => (

                  <tr
                    key={row.key}
                    className="
                      border-t
                      border-border
                      hover:bg-accent/40
                      transition
                    "
                  >

                    {/* FUNCTIONALITY */}

                    <td
                      className="
                        p-4
                        sticky
                        left-0
                        bg-background/80
                        backdrop-blur
                        font-medium
                        z-[1]
                      "
                    >
                      {row.label}
                    </td>

                    {/* ROLE PERMISSIONS */}

                    {order.map(
                      (selectedRole) => {

                        const permission =
                          row.grants[
                            selectedRole
                          ];

                        const isActive =
                          selectedRole ===
                          role;

                        return (
                          <td
                            key={
                              selectedRole
                            }
                            className={cn(
                              `
                                p-3
                                text-center
                              `,
                              isActive &&
                                "bg-primary/5"
                            )}
                          >

                            {/* NOT ALLOWED */}

                            {permission ===
                            false ? (
                              <Minus
                                className="
                                  h-4
                                  w-4
                                  mx-auto
                                  text-muted-foreground/40
                                "
                                aria-label="Not allowed"
                              />
                            ) : permission ===
                              true ? (

                              /* ALLOWED */

                              <Check
                                className="
                                  h-4
                                  w-4
                                  mx-auto
                                  text-success
                                "
                                aria-label="Allowed"
                              />

                            ) : (

                              /* CONDITIONAL */

                              <span
                                className="
                                  text-[10px]
                                  font-semibold
                                  uppercase
                                  tracking-wide
                                  text-warning
                                "
                                title={String(
                                  permission
                                )}
                              >
                                {
                                  permission
                                }
                              </span>

                            )}

                          </td>
                        );
                      }
                    )}

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          className="
            p-4
            border-t
            border-border
            flex
            items-center
            justify-between
            gap-3
            flex-wrap
            text-xs
            text-muted-foreground
          "
        >

          <div>
            {PERMISSION_MATRIX.length}{" "}
            capabilities ·{" "}
            {ROLES.length} roles
          </div>

          <div className="flex items-center gap-4">

            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-success" />
              <span>Allowed</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Minus className="h-3.5 w-3.5 text-muted-foreground/40" />
              <span>Restricted</span>
            </div>

            <div className="text-warning">
              Conditional
            </div>

          </div>

        </div>

      </Card>

    </DashboardLayout>
  );
}