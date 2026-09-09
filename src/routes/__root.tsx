import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import {
  useEffect,
  type ReactNode,
} from "react";

import appCss from "../styles.css?url";

import {
  reportLovableError,
} from "../lib/lovable-error-reporting";

import {
  RoleProvider,
  useRole,
  can,
  type Permission,
  type Role,
} from "../lib/roles";

import {
  getToken,
} from "../lib/auth";


/* =========================================================
   NOT FOUND
========================================================= */

function NotFoundComponent() {

  return (
    <div
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-background
        px-4
      "
    >

      <div
        className="
          max-w-md
          text-center
        "
      >

        <h1
          className="
            text-7xl
            font-bold
            text-foreground
          "
        >
          404
        </h1>

        <h2
          className="
            mt-4
            text-xl
            font-semibold
            text-foreground
          "
        >
          Page not found
        </h2>

        <p
          className="
            mt-2
            text-sm
            text-muted-foreground
          "
        >
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="mt-6">

          <Link
            to="/"
            className="
              inline-flex
              items-center
              justify-center
              rounded-md
              bg-primary
              px-4
              py-2
              text-sm
              font-medium
              text-primary-foreground
              transition-colors
              hover:bg-primary/90
            "
          >
            Go home
          </Link>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   ERROR
========================================================= */

function ErrorComponent({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {

  console.error(error);

  const router =
    useRouter();

  useEffect(() => {

    reportLovableError(
      error,
      {
        boundary:
          "tanstack_root_error_component",
      }
    );

  }, [error]);

  return (
    <div
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-background
        px-4
      "
    >

      <div
        className="
          max-w-md
          text-center
        "
      >

        <h1
          className="
            text-xl
            font-semibold
            tracking-tight
            text-foreground
          "
        >
          This page didn't load
        </h1>

        <p
          className="
            mt-2
            text-sm
            text-muted-foreground
          "
        >
          Something went wrong on our end. You can try refreshing or head back home.
        </p>

        <div
          className="
            mt-6
            flex
            flex-wrap
            justify-center
            gap-2
          "
        >

          <button
            type="button"
            onClick={() => {

              router.invalidate();

              reset();

            }}
            className="
              inline-flex
              items-center
              justify-center
              rounded-md
              bg-primary
              px-4
              py-2
              text-sm
              font-medium
              text-primary-foreground
              transition-colors
              hover:bg-primary/90
            "
          >
            Try again
          </button>

          <Link
            to="/"
            className="
              inline-flex
              items-center
              justify-center
              rounded-md
              border
              border-input
              bg-background
              px-4
              py-2
              text-sm
              font-medium
              text-foreground
              transition-colors
              hover:bg-accent
            "
          >
            Go home
          </Link>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   ROOT ROUTE
========================================================= */

export const Route =
  createRootRouteWithContext<{
    queryClient: QueryClient;
  }>()({

    /* =====================================================
       PAGE HEAD
    ===================================================== */

    head: () => ({

      meta: [

        {
          charSet:
            "utf-8",
        },

        {
          name:
            "viewport",

          content:
            "width=device-width, initial-scale=1",
        },

        {
          title:
            "Netflix Show Management System",
        },

        {
          name:
            "description",

          content:
            "Enterprise CMS for managing the lifecycle of Netflix original shows — from pitch submission to production and analytics.",
        },

        {
          property:
            "og:title",

          content:
            "Netflix Show Management System",
        },

        {
          property:
            "og:description",

          content:
            "Enterprise CMS for managing the lifecycle of Netflix original shows.",
        },

        {
          property:
            "og:type",

          content:
            "website",
        },

        {
          name:
            "twitter:card",

          content:
            "summary_large_image",
        },

      ],

      links: [

        {
          rel:
            "stylesheet",

          href:
            appCss,
        },

        {
          rel:
            "icon",

          href:
            "/favicon.ico",

          type:
            "image/x-icon",
        },

        {
          rel:
            "preconnect",

          href:
            "https://fonts.googleapis.com",
        },

        {
          rel:
            "stylesheet",

          href:
            "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        },

      ],

    }),


    shellComponent:
      RootShell,

    component:
      RootComponent,

    notFoundComponent:
      NotFoundComponent,

    errorComponent:
      ErrorComponent,

  });


/* =========================================================
   ROOT SHELL
========================================================= */

function RootShell({
  children,
}: {
  children: ReactNode;
}) {

  return (
    <html
      lang="en"
      className="dark"
    >

      <head>

        <HeadContent />

      </head>

      <body
        className="
          dark
          bg-background
          text-foreground
        "
      >

        {children}

        <Scripts />

      </body>

    </html>
  );
}


/* =========================================================
   PUBLIC ROUTES
========================================================= */

const PUBLIC_ROUTES = [

  "/",

  "/login",

  "/register",

];


/* =========================================================
   ROUTE PERMISSIONS
========================================================= */

const ROUTE_PERMISSIONS: Array<{
  prefix: string;
  permission: Permission;
}> = [

  /* -------------------------------------------------------
     NEW SHOW
     MUST COME BEFORE /shows
  ------------------------------------------------------- */

  {
    prefix:
      "/shows/new",

    permission:
      "submit_show",
  },


  /* -------------------------------------------------------
     SHOWS
  ------------------------------------------------------- */

  {
    prefix:
      "/shows",

    permission:
      "search_shows",
  },


  /* -------------------------------------------------------
     DASHBOARD
  ------------------------------------------------------- */

  {
    prefix:
      "/dashboard",

    permission:
      "view_platform",
  },


  /* -------------------------------------------------------
     EVALUATION
  ------------------------------------------------------- */

  {
    prefix:
      "/evaluation",

    permission:
      "evaluate_content",
  },


  /* -------------------------------------------------------
     PRODUCTION
  ------------------------------------------------------- */

  {
    prefix:
      "/production",

    permission:
      "view_production_status",
  },


  /* -------------------------------------------------------
     REPORTS
  ------------------------------------------------------- */

  {
    prefix:
      "/reports",

    permission:
      "generate_reports",
  },


  /* -------------------------------------------------------
     ANALYTICS
  ------------------------------------------------------- */

  {
    prefix:
      "/analytics",

    permission:
      "analytics",
  },


  /* -------------------------------------------------------
     NOTIFICATIONS
  ------------------------------------------------------- */

  {
    prefix:
      "/notifications",

    permission:
      "view_platform",
  },


  /* -------------------------------------------------------
     PROFILE
  ------------------------------------------------------- */

  {
    prefix:
      "/profile",

    permission:
      "update_personal_info",
  },


  /* -------------------------------------------------------
     SETTINGS
  ------------------------------------------------------- */

  {
    prefix:
      "/settings",

    permission:
      "update_personal_info",
  },


  /* -------------------------------------------------------
     USERS
  ------------------------------------------------------- */

  {
    prefix:
      "/users",

    permission:
      "manage_users",
  },


  /* -------------------------------------------------------
     AUDIT LOGS
  ------------------------------------------------------- */

  {
    prefix:
      "/audit-logs",

    permission:
      "audit_logs",
  },

];


/* =========================================================
   PUBLIC ROUTE CHECK
========================================================= */

function isPublicRoute(
  pathname: string
): boolean {

  return PUBLIC_ROUTES.includes(
    pathname
  );
}


/* =========================================================
   GET ROUTE PERMISSION
========================================================= */

function getRoutePermission(
  pathname: string
): Permission | null {

  /*
   * Permission Matrix is Admin-only.
   */

  if (
    pathname ===
    "/permissions"
  ) {

    return null;
  }


  const rule =
    ROUTE_PERMISSIONS.find(
      (item) => {

        return (
          pathname ===
            item.prefix ||
          pathname.startsWith(
            `${item.prefix}/`
          )
        );

      }
    );


  return (
    rule?.permission ??
    null
  );
}


/* =========================================================
   AUTH GATE
========================================================= */

function AuthGate() {

  const navigate =
    useNavigate();


  const location =
    useLocation();


  const pathname =
    location.pathname;


  /*
   * Actual role from RoleProvider.
   *
   * NO role switching.
   */

  const {
    role,
    initialized,
  } = useRole();


  /* =======================================================
     AUTHORIZATION
  ======================================================= */

  useEffect(() => {

    /* -----------------------------------------------------
       PUBLIC PAGE
    ----------------------------------------------------- */

    if (
      isPublicRoute(
        pathname
      )
    ) {

      return;
    }


    /* -----------------------------------------------------
       WAIT FOR CLIENT HYDRATION
    ----------------------------------------------------- */

    if (
      !initialized
    ) {

      return;
    }


    /* -----------------------------------------------------
       TOKEN
    ----------------------------------------------------- */

    const token =
      getToken();


    /*
     * No token = not logged in.
     */

    if (
      !token
    ) {

      void navigate({
        to:
          "/login",

        replace:
          true,
      });

      return;
    }


    /* -----------------------------------------------------
       ACTUAL AUTHENTICATED ROLE
    ----------------------------------------------------- */

    const authenticatedRole =
      (
        role ||
        "GUEST"
      ).toUpperCase() as Role;


    /* -----------------------------------------------------
       PERMISSIONS PAGE
    ----------------------------------------------------- */

    if (
      pathname ===
      "/permissions"
    ) {

      if (
        authenticatedRole !==
        "ADMIN"
      ) {

        void navigate({
          to:
            "/dashboard",

          replace:
            true,
        });

      }

      return;
    }


    /* -----------------------------------------------------
       NORMAL ROUTE PERMISSION
    ----------------------------------------------------- */

    const permission =
      getRoutePermission(
        pathname
      );


    /*
     * No permission rule means
     * authenticated users may access it.
     */

    if (
      !permission
    ) {

      return;
    }


    /* -----------------------------------------------------
       CHECK PERMISSION
    ----------------------------------------------------- */

    const allowed =
      can(
        authenticatedRole,
        permission
      );


    /* -----------------------------------------------------
       ACCESS DENIED
    ----------------------------------------------------- */

    if (
      !allowed
    ) {

      void navigate({
        to:
          "/dashboard",

        replace:
          true,
      });

    }

  }, [
    pathname,
    navigate,
    initialized,
    role,
  ]);


  return null;
}


/* =========================================================
   ROOT COMPONENT
========================================================= */

function RootComponent() {

  const {
    queryClient,
  } =
    Route.useRouteContext();


  return (
    <QueryClientProvider
      client={queryClient}
    >

      <RoleProvider>

        <AuthGate />

        <Outlet />

      </RoleProvider>

    </QueryClientProvider>
  );
}