import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getStoredUser,
  getStoredRole,
  getToken,
} from "@/lib/auth";

/* =========================================================
   ROLES
========================================================= */

export type Role =
  | "GUEST"
  | "VIEWER"
  | "CREATOR"
  | "DIRECTOR"
  | "PRODUCER"
  | "CONTENT_MANAGER"
  | "ADMIN";


/* =========================================================
   PERMISSIONS
========================================================= */

export type Permission =
  | "view_platform"
  | "submit_show"
  | "view_own_content"
  | "search_shows"
  | "view_production_status"
  | "update_personal_info"
  | "manage_productions"
  | "evaluate_content"
  | "approve_shows"
  | "manage_budgets"
  | "view_all_content"
  | "generate_reports"
  | "manage_users"
  | "system_configuration"
  | "analytics"
  | "audit_logs";


/* =========================================================
   ROLE LABELS
========================================================= */

export const ROLE_LABELS: Record<
  Role,
  string
> = {

  GUEST:
    "Guest",

  VIEWER:
    "Viewer",

  CREATOR:
    "Creator",

  DIRECTOR:
    "Director",

  PRODUCER:
    "Producer",

  CONTENT_MANAGER:
    "Content Manager",

  ADMIN:
    "Administrator",
};


/* =========================================================
   ROLE DESCRIPTIONS
========================================================= */

export const ROLE_DESCRIPTIONS: Record<
  Role,
  string
> = {

  GUEST:
    "Public browsing only",

  VIEWER:
    "Reads approved content",

  CREATOR:
    "Submits pitches and manages own content",

  DIRECTOR:
    "Manages creative direction and own productions",

  PRODUCER:
    "Manages production, budgets and crews",

  CONTENT_MANAGER:
    "Evaluates, approves and oversees content",

  ADMIN:
    "Full system control",
};


/* =========================================================
   ROLE PERMISSION MATRIX
   =========================================================

   This mirrors the SRS permission matrix.

   Guest:
     View platform
     Search shows

   Viewer:
     View platform
     View own content
     Search shows
     Update personal info

   Creator:
     View platform
     Submit show
     View own content
     Search shows
     View production status
     Update personal info

   Director:
     View platform
     Submit show
     View own content
     Search shows
     View production status
     Update personal info
     Manage productions
     Generate reports

   Producer:
     View platform
     Search shows
     View production status
     Update personal info
     Manage productions
     Manage budgets
     View all content
     Generate reports

   Content Manager:
     View platform
     Search shows
     View production status
     Update personal info
     Evaluate content
     Approve shows
     Manage budgets
     View all content
     Generate reports

   Admin:
     Everything
========================================================= */

export const ROLE_PERMISSIONS: Record<
  Role,
  readonly Permission[]
> = {

  GUEST: [

    "view_platform",

    "search_shows",

  ],

  VIEWER: [

    "view_platform",

    "view_own_content",

    "search_shows",

    "update_personal_info",

  ],

  CREATOR: [

    "view_platform",

    "submit_show",

    "view_own_content",

    "search_shows",

    "view_production_status",

    "update_personal_info",

  ],

  DIRECTOR: [

    "view_platform",

    "submit_show",

    "view_own_content",

    "search_shows",

    "view_production_status",

    "update_personal_info",

    "manage_productions",

    "generate_reports",

  ],

  PRODUCER: [

    "view_platform",

    "search_shows",

    "view_production_status",

    "update_personal_info",

    "manage_productions",

    "manage_budgets",

    "view_all_content",

    "generate_reports",

  ],

  CONTENT_MANAGER: [

    "view_platform",

    "search_shows",

    "view_production_status",

    "update_personal_info",

    "evaluate_content",

    "approve_shows",

    "manage_budgets",

    "view_all_content",

    "generate_reports",

  ],

  ADMIN: [

    "view_platform",

    "submit_show",

    "view_own_content",

    "search_shows",

    "view_production_status",

    "update_personal_info",

    "manage_productions",

    "evaluate_content",

    "approve_shows",

    "manage_budgets",

    "view_all_content",

    "generate_reports",

    "manage_users",

    "system_configuration",

    "analytics",

    "audit_logs",

  ],

};


/* =========================================================
   NORMALIZE ROLE
========================================================= */

export function normalizeRole(
  value: unknown
): Role {

  if (
    typeof value !== "string"
  ) {

    return "GUEST";
  }


  const normalized =
    value
      .trim()
      .toUpperCase()
      .replace(
        /^ROLE_/,
        ""
      )
      .replace(
        /[\s-]+/g,
        "_"
      );


  switch (
    normalized
  ) {

    case "ADMIN":

    case "ADMINISTRATOR":

      return "ADMIN";


    case "CREATOR":

      return "CREATOR";


    case "DIRECTOR":

      return "DIRECTOR";


    case "PRODUCER":

      return "PRODUCER";


    case "CONTENT_MANAGER":

    case "CONTENTMANAGER":

    case "CONTENT_MANAGER_ROLE":

      return "CONTENT_MANAGER";


    case "VIEWER":

      return "VIEWER";


    case "GUEST":

      return "GUEST";


    default:

      return "GUEST";
  }
}


/* =========================================================
   EXTRACT ROLE
========================================================= */

export function extractRole(
  value: unknown
): Role | null {

  if (
    value === null ||
    value === undefined
  ) {

    return null;
  }


  /* -------------------------------------------------------
     Direct string
  ------------------------------------------------------- */

  if (
    typeof value === "string"
  ) {

    const normalized =
      normalizeRole(
        value
      );

    /*
     * Don't treat arbitrary strings as GUEST.
     * Return null so caller can continue looking.
     */

    const validRoles: string[] = [

      "GUEST",

      "VIEWER",

      "CREATOR",

      "DIRECTOR",

      "PRODUCER",

      "CONTENT_MANAGER",

      "ADMIN",

      "ADMINISTRATOR",

    ];


    const cleaned =
      value
        .trim()
        .toUpperCase()
        .replace(
          /^ROLE_/,
          ""
        )
        .replace(
          /[\s-]+/g,
          "_"
        );


    if (
      validRoles.includes(
        cleaned
      )
    ) {

      return normalized;
    }


    return null;
  }


  /* -------------------------------------------------------
     Array
  ------------------------------------------------------- */

  if (
    Array.isArray(value)
  ) {

    for (
      const item of value
    ) {

      const role =
        extractRole(
          item
        );


      if (role) {

        return role;
      }
    }


    return null;
  }


  /* -------------------------------------------------------
     Object
  ------------------------------------------------------- */

  if (
    typeof value ===
    "object"
  ) {

    const object =
      value as Record<
        string,
        unknown
      >;


    /*
     * Direct role fields
     */

    const directCandidates = [

      object.role,

      object.roleName,

      object.authority,

      object.name,

    ];


    for (
      const candidate
      of directCandidates
    ) {

      const role =
        extractRole(
          candidate
        );


      if (role) {

        return role;
      }
    }


    /*
     * Nested role fields
     */

    const nestedCandidates = [

      object.roles,

      object.authorities,

      object.user,

      object.data,

      object.profile,

    ];


    for (
      const candidate
      of nestedCandidates
    ) {

      const role =
        extractRole(
          candidate
        );


      if (role) {

        return role;
      }
    }
  }


  return null;
}


/* =========================================================
   READ AUTHENTICATED ROLE
   =========================================================

   IMPORTANT:

   This function NEVER changes the role.

   It only reads the role assigned by the backend.

   SSR safe because auth.ts is SSR safe.
========================================================= */

export function readAuthenticatedRole():
  Role {

  /*
   * -------------------------------------------------------
   * 1. Stored backend user
   * -------------------------------------------------------
   */

  const storedUser =
    getStoredUser();


  const storedUserRole =
    extractRole(
      storedUser
    );


  if (
    storedUserRole
  ) {

    return storedUserRole;
  }


  /*
   * -------------------------------------------------------
   * 2. Explicit stored role
   * -------------------------------------------------------
   */

  const storedRole =
    getStoredRole();


  if (
    storedRole
  ) {

    return normalizeRole(
      storedRole
    );
  }


  /*
   * -------------------------------------------------------
   * 3. JWT fallback
   * -------------------------------------------------------
   *
   * Current backend JWT primarily contains
   * username/subject, but this fallback supports
   * role claims if they are present.
   */

  const token =
    getToken();


  if (
    !token
  ) {

    return "GUEST";
  }


  const jwtRole =
    extractRoleFromJwt(
      token
    );


  if (
    jwtRole
  ) {

    return jwtRole;
  }


  /*
   * No authenticated role available.
   */

  return "GUEST";
}


/* =========================================================
   JWT ROLE FALLBACK
========================================================= */

function extractRoleFromJwt(
  token: string
): Role | null {

  if (
    typeof window ===
    "undefined"
  ) {

    return null;
  }


  try {

    const parts =
      token.split(".");


    if (
      parts.length !== 3
    ) {

      return null;
    }


    const base64 =
      parts[1]
        .replace(
          /-/g,
          "+"
        )
        .replace(
          /_/g,
          "/"
        );


    const padded =
      base64 +
      "=".repeat(
        (
          4 -
          (base64.length % 4)
        ) % 4
      );


    const payload =
      JSON.parse(
        window.atob(
          padded
        )
      );


    return extractRole(
      payload
    );

  }
  catch {

    return null;
  }
}


/* =========================================================
   PERMISSION CHECK
========================================================= */

export function can(
  role: Role | string | null | undefined,
  permission: Permission
): boolean {

  const normalizedRole =
    normalizeRole(
      role
    );


  /*
   * ADMIN automatically has
   * all permissions.
   */

  if (
    normalizedRole ===
    "ADMIN"
  ) {

    return true;
  }


  return (
    ROLE_PERMISSIONS[
      normalizedRole
    ]?.includes(
      permission
    ) ?? false
  );
}


/* =========================================================
   HAS PERMISSION
========================================================= */

export function hasPermission(
  permission: Permission,
  role?: Role | string | null
): boolean {

  const currentRole =
    role ??
    readAuthenticatedRole();


  return can(
    currentRole,
    permission
  );
}


/* =========================================================
   HAS ANY PERMISSION
========================================================= */

export function hasAnyPermission(
  permissions: readonly Permission[],
  role?: Role | string | null
): boolean {

  const currentRole =
    role ??
    readAuthenticatedRole();


  return permissions.some(
    (permission) =>
      can(
        currentRole,
        permission
      )
  );
}


/* =========================================================
   HAS ALL PERMISSIONS
========================================================= */

export function hasAllPermissions(
  permissions: readonly Permission[],
  role?: Role | string | null
): boolean {

  const currentRole =
    role ??
    readAuthenticatedRole();


  return permissions.every(
    (permission) =>
      can(
        currentRole,
        permission
      )
  );
}


/* =========================================================
   ROLE CHECK
========================================================= */

export function hasRole(
  requiredRole: Role,
  currentRole?: Role | string | null
): boolean {

  const role =
    currentRole ??
    readAuthenticatedRole();


  return (
    normalizeRole(
      role
    ) ===
    requiredRole
  );
}


/* =========================================================
   ANY ROLE CHECK
========================================================= */

export function hasAnyRole(
  roles: readonly Role[],
  currentRole?: Role | string | null
): boolean {

  const role =
    normalizeRole(
      currentRole ??
      readAuthenticatedRole()
    );


  return roles.includes(
    role
  );
}


/* =========================================================
   ROLE CONTEXT
========================================================= */

interface RoleContextValue {

  /*
   * Actual authenticated role.
   */

  role: Role;


  /*
   * Whether the browser-side auth state
   * has been loaded.
   */

  initialized: boolean;


  /*
   * Permission check.
   */

  can: (
    permission: Permission
  ) => boolean;


  /*
   * Role check.
   */

  hasRole: (
    requiredRole: Role
  ) => boolean;


  /*
   * Multiple role check.
   */

  hasAnyRole: (
    roles: readonly Role[]
  ) => boolean;


  /*
   * Permission helpers.
   */

  hasPermission: (
    permission: Permission
  ) => boolean;

  hasAnyPermission: (
    permissions: readonly Permission[]
  ) => boolean;

  hasAllPermissions: (
    permissions: readonly Permission[]
  ) => boolean;

}


const RoleContext =
  createContext<
    RoleContextValue | undefined
  >(
    undefined
  );


/* =========================================================
   ROLE PROVIDER
========================================================= */

export function RoleProvider({
  children,
}: {
  children: ReactNode;
}) {

  /*
   * -------------------------------------------------------
   * IMPORTANT SSR RULE
   * -------------------------------------------------------
   *
   * NEVER call localStorage/sessionStorage
   * directly in the useState initializer.
   *
   * Server rendering has no browser storage.
   */

  const [
    role,
    setRole,
  ] = useState<Role>(
    "GUEST"
  );


  const [
    initialized,
    setInitialized,
  ] = useState(
    false
  );


  /* -------------------------------------------------------
     Load actual backend role after browser hydration.
  ------------------------------------------------------- */

  useEffect(() => {

    const authenticatedRole =
      readAuthenticatedRole();


    setRole(
      authenticatedRole
    );


    setInitialized(
      true
    );

  }, []);


  /* -------------------------------------------------------
     Listen for login/logout.
  ------------------------------------------------------- */

  useEffect(() => {

    if (
      typeof window ===
      "undefined"
    ) {

      return;
    }


    const handleAuthChange =
      () => {

        const authenticatedRole =
          readAuthenticatedRole();


        setRole(
          authenticatedRole
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


  /* -------------------------------------------------------
     Context value
  ------------------------------------------------------- */

  const value =
    useMemo<RoleContextValue>(
      () => ({

        role,

        initialized,

        can: (
          permission
        ) =>
          can(
            role,
            permission
          ),

        hasRole: (
          requiredRole
        ) =>
          role ===
          requiredRole,

        hasAnyRole: (
          roles
        ) =>
          roles.includes(
            role
          ),

        hasPermission: (
          permission
        ) =>
          can(
            role,
            permission
          ),

        hasAnyPermission: (
          permissions
        ) =>
          permissions.some(
            (permission) =>
              can(
                role,
                permission
              )
          ),

        hasAllPermissions: (
          permissions
        ) =>
          permissions.every(
            (permission) =>
              can(
                role,
                permission
              )
          ),

      }),
      [
        role,
        initialized,
      ]
    );


  return (
    <RoleContext.Provider
      value={value}
    >

      {children}

    </RoleContext.Provider>
  );
}


/* =========================================================
   USE ROLE
========================================================= */

export function useRole():
  RoleContextValue {

  const context =
    useContext(
      RoleContext
    );


  if (
    !context
  ) {

    throw new Error(
      "useRole must be used inside RoleProvider"
    );
  }


  return context;
}


/* =========================================================
   CURRENT ROLE
========================================================= */

export function getCurrentRole():
  Role {

  return readAuthenticatedRole();
}


/* =========================================================
   ROLE DISPLAY NAME
========================================================= */

export function getRoleLabel(
  role: Role | string | null | undefined
): string {

  const normalized =
    normalizeRole(
      role
    );


  return (
    ROLE_LABELS[
      normalized
    ] ??
    "Guest"
  );
}


/* =========================================================
   ROLE DESCRIPTION
========================================================= */

export function getRoleDescription(
  role: Role | string | null | undefined
): string {

  const normalized =
    normalizeRole(
      role
    );


  return (
    ROLE_DESCRIPTIONS[
      normalized
    ] ??
    ROLE_DESCRIPTIONS.GUEST
  );
}


/* =========================================================
   ROLE LIST
   =========================================================

   Useful for displaying role information.

   IMPORTANT:
   This is NOT a role-switcher.

   Do NOT call setRole() from UI.
========================================================= */

export const AVAILABLE_ROLES: readonly Role[] = [

  "GUEST",

  "VIEWER",

  "CREATOR",

  "DIRECTOR",

  "PRODUCER",

  "CONTENT_MANAGER",

  "ADMIN",

];


/* =========================================================
   ROLE INFORMATION
========================================================= */

export interface RoleInfo {

  id: Role;

  label: string;

  description: string;

  permissions: readonly Permission[];

}


export const ROLE_INFO: readonly RoleInfo[] =
  AVAILABLE_ROLES.map(
    (role) => ({

      id: role,

      label:
        ROLE_LABELS[
          role
        ],

      description:
        ROLE_DESCRIPTIONS[
          role
        ],

      permissions:
        ROLE_PERMISSIONS[
          role
        ],

    })
  );