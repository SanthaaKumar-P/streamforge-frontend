import {
  Link,
  useRouterState,
  useNavigate,
} from "@tanstack/react-router";

import {
  LayoutDashboard,
  Film,
  PlusSquare,
  ClipboardCheck,
  Kanban,
  BarChart3,
  Bell,
  ScrollText,
  User,
  Settings,
  LogOut,
  Clapperboard,
  Users,
  FileBarChart,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  cn,
} from "@/lib/utils";

import {
  apiRequest,
} from "@/lib/api";

import {
  logout,
  getStoredUser,
} from "@/lib/auth";

import {
  useRole,
  type Permission,
} from "@/lib/roles";


/* =========================================================
   TYPES
========================================================= */

interface StoredUser {

  userId?: number;

  fullName?: string;

  username?: string;

  email?: string;

  phone?: string;

  employeeCode?: string;

  bio?: string;

  isActive?: boolean;

  role?:
    | string
    | {
        roleId?: number;

        roleName?: string;

        description?: string;
      };

}


type Item = {

  to: string;

  label: string;

  icon: typeof Film;

  perm: Permission;

};


/* =========================================================
   NAVIGATION
========================================================= */

const nav: {
  section: string;

  items: Item[];

}[] = [

  /* =======================================================
     OVERVIEW
  ======================================================= */

  {
    section: "Overview",

    items: [

      {
        to: "/dashboard",

        label: "Dashboard",

        icon: LayoutDashboard,

        perm: "view_platform",
      },

      {
        to: "/analytics",

        label: "Analytics",

        icon: BarChart3,

        perm: "analytics",
      },

    ],
  },


  /* =======================================================
     CONTENT
  ======================================================= */

  {
    section: "Content",

    items: [

      {
        to: "/shows",

        label: "Shows",

        icon: Film,

        perm: "search_shows",
      },

      {
        to: "/shows/new",

        label: "Submit Show",

        icon: PlusSquare,

        perm: "submit_show",
      },

      {
        to: "/evaluation",

        label: "Evaluation",

        icon: ClipboardCheck,

        perm: "evaluate_content",
      },

      {
        to: "/production",

        label: "Production",

        icon: Kanban,

        perm: "view_production_status",
      },

      {
        to: "/reports",

        label: "Reports",

        icon: FileBarChart,

        perm: "generate_reports",
      },

    ],
  },


  /* =======================================================
     ADMINISTRATION
  ======================================================= */

  {
    section: "Administration",

    items: [

      {
        to: "/users",

        label: "User Management",

        icon: Users,

        perm: "manage_users",
      },

      {
        to: "/audit-logs",

        label: "Audit Logs",

        icon: ScrollText,

        perm: "audit_logs",
      },

    ],
  },


  /* =======================================================
     WORKSPACE
  ======================================================= */

  {
    section: "Workspace",

    items: [

      {
        to: "/notifications",

        label: "Notifications",

        icon: Bell,

        perm: "view_platform",
      },

      {
        to: "/profile",

        label: "Profile",

        icon: User,

        perm: "update_personal_info",
      },

      {
        to: "/settings",

        label: "Settings",

        icon: Settings,

        perm: "update_personal_info",
      },

    ],
  },

];


/* =========================================================
   SIDEBAR
========================================================= */

export function Sidebar() {

  /* -------------------------------------------------------
     CURRENT PATH
  ------------------------------------------------------- */

  const pathname =
    useRouterState({
      select: (state) =>
        state.location.pathname,
    });


  /* -------------------------------------------------------
     ACTUAL AUTHENTICATED ROLE
  ------------------------------------------------------- */

  const {
    can,
    role,
    initialized,
  } = useRole();


  /* -------------------------------------------------------
     CURRENT USER
  ------------------------------------------------------- */

  const [
    user,
    setUser,
  ] = useState<StoredUser | null>(
    null
  );


  /* -------------------------------------------------------
     LOGOUT
  ------------------------------------------------------- */

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);


  const navigate =
    useNavigate();


  /* =======================================================
     LOAD USER
  ======================================================= */

  useEffect(() => {

    const currentUser =
      getStoredUser();


    if (
      currentUser
    ) {

      setUser(
        currentUser as StoredUser
      );

    }
    else {

      setUser(
        null
      );

    }

  }, [
    initialized,
  ]);


  /* =======================================================
     AUTH CHANGE LISTENER
  ======================================================= */

  useEffect(() => {

    if (
      typeof window ===
      "undefined"
    ) {

      return;
    }


    const handleAuthChange =
      () => {

        const currentUser =
          getStoredUser();


        setUser(
          currentUser as StoredUser | null
        );

      };


    window.addEventListener(
      "streamforge:auth-changed",
      handleAuthChange
    );


    return () => {

      window.removeEventListener(
        "streamforge:auth-changed",
        handleAuthChange
      );

    };

  }, []);


  /* =======================================================
     DISPLAY NAME
  ======================================================= */

  const displayName =
    user?.fullName?.trim() ||
    user?.username?.trim() ||
    user?.email?.trim() ||
    "User";


  /* =======================================================
     ROLE LABEL
  ======================================================= */

  const roleLabel =
    role === "ADMIN"
      ? "Administrator"
      : role === "CONTENT_MANAGER"
        ? "Content Manager"
        : role === "PRODUCER"
          ? "Producer"
          : role === "DIRECTOR"
            ? "Director"
            : role === "CREATOR"
              ? "Creator"
              : role === "VIEWER"
                ? "Viewer"
                : "Guest";


  /* =======================================================
     INITIALS
  ======================================================= */

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]?.toUpperCase() ||
          ""
      )
      .join("") ||
    "U";


  /* =======================================================
     LOGOUT
  ======================================================= */

  async function handleLogout() {

    if (
      loggingOut
    ) {

      return;
    }


    setLoggingOut(
      true
    );


    try {

      /*
       * -----------------------------------------------------
       * Backend logout
       * -----------------------------------------------------
       */

      await apiRequest<void>(
        "/api/auth/logout",
        {
          method: "POST",
        }
      );

    }
    catch (error) {

      /*
       * Backend logout failure should never
       * prevent local logout.
       */

      console.warn(
        "Backend logout failed. Continuing local logout.",
        error
      );

    }
    finally {

      /*
       * -----------------------------------------------------
       * Clear local authentication
       * -----------------------------------------------------
       */

      logout();


      /*
       * -----------------------------------------------------
       * Navigate to login
       * -----------------------------------------------------
       */

      await navigate({
        to: "/login",

        replace: true,
      });


      setLoggingOut(
        false
      );

    }

  }


  /* =======================================================
     SIDEBAR
  ======================================================= */

  return (

    <aside
      className="
        hidden
        lg:flex
        fixed
        left-0
        top-0
        bottom-0
        w-64
        flex-col
        border-r
        border-border
        bg-sidebar
        z-40
      "
    >


      {/* =================================================
          LOGO
      ================================================= */}

      <div
        className="
          h-16
          flex
          items-center
          gap-2
          px-6
          border-b
          border-sidebar-border
        "
      >

        <div
          className="
            h-9
            w-9
            grid
            place-items-center
            rounded-xl
            bg-primary
            shadow-[var(--shadow-glow)]
          "
        >

          <Clapperboard
            className="
              h-5
              w-5
              text-primary-foreground
            "
          />

        </div>


        <div
          className="
            leading-tight
          "
        >

          <div
            className="
              text-sm
              font-bold
              tracking-wide
              text-sidebar-foreground
            "
          >
            NETFLIX
          </div>


          <div
            className="
              text-[10px]
              uppercase
              tracking-[0.2em]
              text-muted-foreground
            "
          >
            Show Manager
          </div>

        </div>

      </div>


      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav
        className="
          flex-1
          overflow-y-auto
          scrollbar-thin
          px-3
          py-4
          space-y-6
        "
      >

        {nav.map(
          (group) => (

            <div
              key={
                group.section
              }
            >

              {/* -------------------------------------------
                  SECTION TITLE
              ------------------------------------------- */}

              <div
                className="
                  px-3
                  mb-2
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-widest
                  text-muted-foreground
                "
              >
                {group.section}
              </div>


              {/* -------------------------------------------
                  ITEMS
              ------------------------------------------- */}

              <ul
                className="
                  space-y-0.5
                "
              >

                {group.items.map(
                  (item) => {

                    /* -------------------------------------
                       ACTIVE
                    ------------------------------------- */

                    const active =
                      pathname ===
                        item.to ||
                      (
                        item.to !==
                          "/dashboard" &&
                        pathname.startsWith(
                          item.to
                        )
                      );


                    /* -------------------------------------
                       PERMISSION
                    ------------------------------------- */

                    const allowed =
                      can(
                        item.perm
                      );


                    /*
                     * User doesn't have permission.
                     *
                     * Don't display the menu item.
                     */

                    if (
                      !allowed
                    ) {

                      return null;
                    }


                    return (

                      <li
                        key={
                          item.to
                        }
                      >

                        <Link
                          to={
                            item.to
                          }

                          className={cn(

                            `
                              group
                              flex
                              items-center
                              gap-3
                              rounded-xl
                              px-3
                              py-2.5
                              text-sm
                              transition-all
                            `,

                            active
                              ? `
                                bg-primary/10
                                text-primary-foreground
                                shadow-inner
                              `
                              : `
                                text-sidebar-foreground/80
                                hover:bg-sidebar-accent
                                hover:text-sidebar-foreground
                              `
                          )}
                        >

                          {/* --------------------------------
                              ICON
                          -------------------------------- */}

                          <item.icon
                            className={cn(

                              `
                                h-4
                                w-4
                                shrink-0
                              `,

                              active
                                ? `
                                  text-primary
                                `
                                : `
                                  text-muted-foreground
                                  group-hover:text-foreground
                                `
                            )}
                          />


                          {/* --------------------------------
                              LABEL
                          -------------------------------- */}

                          <span
                            className="
                              truncate
                            "
                          >
                            {
                              item.label
                            }
                          </span>


                          {/* --------------------------------
                              ACTIVE DOT
                          -------------------------------- */}

                          {active && (

                            <span
                              className="
                                ml-auto
                                h-1.5
                                w-1.5
                                rounded-full
                                bg-primary
                                animate-pulse-glow
                              "
                            />

                          )}

                        </Link>

                      </li>

                    );

                  }
                )}

              </ul>

            </div>

          )
        )}

      </nav>


      {/* =================================================
          CURRENT USER
      ================================================= */}

      <div
        className="
          p-3
          border-t
          border-sidebar-border
        "
      >

        <div
          className="
            glass
            rounded-2xl
            p-3
            space-y-2
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            {/* -------------------------------------------
                AVATAR
            ------------------------------------------- */}

            <div
              className="
                h-9
                w-9
                rounded-full
                bg-primary/15
                text-primary
                grid
                place-items-center
                text-[10px]
                font-bold
                shrink-0
              "
            >
              {initials}
            </div>


            {/* -------------------------------------------
                USER DETAILS
            ------------------------------------------- */}

            <div
              className="
                min-w-0
                flex-1
              "
            >

              <div
                className="
                  text-sm
                  font-medium
                  truncate
                "
              >
                {displayName}
              </div>


              <div
                className="
                  text-xs
                  text-muted-foreground
                  truncate
                "
              >
                {roleLabel}
              </div>

            </div>


            {/* -------------------------------------------
                LOGOUT
            ------------------------------------------- */}

            <button
              type="button"

              onClick={
                handleLogout
              }

              disabled={
                loggingOut
              }

              aria-label="Sign out"

              title="Sign out"

              className="
                text-muted-foreground
                hover:text-primary
                transition-colors
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >

              <LogOut
                className="
                  h-4
                  w-4
                "
              />

            </button>

          </div>


          {/* -------------------------------------------
              ROLE BADGE
          ------------------------------------------- */}

          <div
            className="
              rounded-lg
              bg-primary/5
              border
              border-primary/10
              px-2.5
              py-1.5
            "
          >

            <div
              className="
                text-[9px]
                uppercase
                tracking-wider
                text-muted-foreground
              "
            >
              Signed in as
            </div>


            <div
              className="
                text-[11px]
                font-medium
                text-primary
                mt-0.5
              "
            >
              {roleLabel}
            </div>

          </div>

        </div>

      </div>

    </aside>

  );
}