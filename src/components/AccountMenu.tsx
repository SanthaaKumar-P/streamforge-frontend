import {
  useEffect,
  useState,
} from "react";

import {
  ChevronDown,
  LogOut,
  Settings,
  User,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "@tanstack/react-router";

import {
  useRole,
} from "@/lib/roles";

import {
  getStoredUser,
  logout,
} from "@/lib/auth";

import {
  apiRequest,
} from "@/lib/api";

import {
  cn,
} from "@/lib/utils";


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


/* =========================================================
   ACCOUNT MENU
========================================================= */

export function AccountMenu({
  compact = false,
}: {
  compact?: boolean;
}) {

  /* -------------------------------------------------------
     ACTUAL AUTHENTICATED ROLE
     -------------------------------------------------------

     IMPORTANT:

     We are only READING the role.

     There is NO role switching here.
  ------------------------------------------------------- */

  const {
    role,
    initialized,
  } = useRole();


  /* -------------------------------------------------------
     USER PROFILE
  ------------------------------------------------------- */

  const [
    user,
    setUser,
  ] = useState<StoredUser | null>(
    null
  );


  /* -------------------------------------------------------
     MENU STATE
  ------------------------------------------------------- */

  const [
    open,
    setOpen,
  ] = useState(false);


  /* -------------------------------------------------------
     LOGOUT STATE
  ------------------------------------------------------- */

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);


  const navigate =
    useNavigate();


  /* =======================================================
     LOAD CURRENT USER
  ======================================================= */

  useEffect(() => {

    const storedUser =
      getStoredUser();


    if (
      storedUser
    ) {

      setUser(
        storedUser as StoredUser
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
     LISTEN FOR LOGIN / LOGOUT
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

        const storedUser =
          getStoredUser();


        setUser(
          storedUser as StoredUser | null
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
          part[0]?.toUpperCase() || ""
      )
      .join("") || "U";


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
       * Tell backend to invalidate the current session.
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
       * Backend logout failure must NOT prevent
       * local logout.
       */

      console.warn(
        "Backend logout failed. Clearing local authentication.",
        error
      );

    }
    finally {

      /*
       * -----------------------------------------------------
       * ALWAYS clear local authentication.
       * -----------------------------------------------------
       */

      logout();


      setOpen(
        false
      );


      /*
       * -----------------------------------------------------
       * Navigate to login.
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
     COMPONENT
  ======================================================= */

  return (
    <div className="relative">


      {/* ===================================================
          ACCOUNT BUTTON
      =================================================== */}

      <button
        type="button"

        onClick={() =>
          setOpen(
            (value) =>
              !value
          )
        }

        aria-haspopup="menu"

        aria-expanded={open}

        disabled={loggingOut}

        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-border text-sm hover:bg-accent transition",

          compact
            ? "h-10 px-2.5"
            : "h-10 px-3",

          loggingOut &&
            "opacity-60 cursor-not-allowed"
        )}
      >


        {/* =================================================
            AVATAR
        ================================================= */}

        <span
          className="
            h-7
            w-7
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
        </span>


        {/* =================================================
            USER INFO
        ================================================= */}

        {!compact && (

          <span
            className="
              text-left
              leading-tight
              max-w-32
            "
          >

            {/* Name */}

            <span
              className="
                block
                font-medium
                truncate
              "
            >
              {displayName}
            </span>


            {/* Actual Role */}

            <span
              className="
                block
                text-[10px]
                text-muted-foreground
                truncate
              "
            >
              {roleLabel}
            </span>

          </span>

        )}


        {/* =================================================
            ARROW
        ================================================= */}

        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",

            open &&
              "rotate-180"
          )}
        />

      </button>


      {/* ===================================================
          DROPDOWN
      =================================================== */}

      {open && (

        <>

          {/* ===============================================
              OUTSIDE CLICK
          =============================================== */}

          <div
            className="
              fixed
              inset-0
              z-40
            "

            onClick={() =>
              setOpen(false)
            }
          />


          {/* ===============================================
              MENU
          =============================================== */}

          <div
            role="menu"

            className="
              absolute
              right-0
              mt-2
              w-64
              z-50
              glass
              rounded-2xl
              p-2
              shadow-[var(--shadow-elegant)]
              animate-fade-in-up
            "
          >


            {/* =============================================
                USER HEADER
            ============================================= */}

            <div
              className="
                px-3
                py-3
                border-b
                border-border
                mb-1
              "
            >

              {/* Avatar + user */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <div
                  className="
                    h-10
                    w-10
                    rounded-full
                    bg-primary/15
                    text-primary
                    grid
                    place-items-center
                    text-xs
                    font-bold
                    shrink-0
                  "
                >
                  {initials}
                </div>


                <div
                  className="
                    min-w-0
                  "
                >

                  <div
                    className="
                      text-sm
                      font-semibold
                      truncate
                    "
                  >
                    {displayName}
                  </div>


                  {user?.email && (

                    <div
                      className="
                        text-[11px]
                        text-muted-foreground
                        truncate
                        mt-0.5
                      "
                    >
                      {user.email}
                    </div>

                  )}

                </div>

              </div>


              {/* =========================================
                  ROLE
              ========================================= */}

              <div
                className="
                  mt-3
                  rounded-xl
                  bg-primary/5
                  border
                  border-primary/10
                  px-3
                  py-2
                "
              >

                <div
                  className="
                    text-[10px]
                    uppercase
                    tracking-wider
                    text-muted-foreground
                  "
                >
                  Current role
                </div>


                <div
                  className="
                    text-sm
                    font-medium
                    text-primary
                    mt-0.5
                  "
                >
                  {roleLabel}
                </div>


                <div
                  className="
                    text-[11px]
                    text-muted-foreground
                    mt-1
                  "
                >
                  Role assigned by your account
                </div>

              </div>

            </div>


            {/* =============================================
                PROFILE
            ============================================= */}

            <Link
              to="/profile"

              onClick={() =>
                setOpen(false)
              }

              className="
                flex
                items-center
                gap-3
                rounded-xl
                px-3
                py-2.5
                text-sm
                hover:bg-accent
                transition
              "

              role="menuitem"
            >

              <User
                className="
                  h-4
                  w-4
                  text-muted-foreground
                "
              />

              <span>
                Profile
              </span>

            </Link>


            {/* =============================================
                SETTINGS
            ============================================= */}

            <Link
              to="/settings"

              onClick={() =>
                setOpen(false)
              }

              className="
                flex
                items-center
                gap-3
                rounded-xl
                px-3
                py-2.5
                text-sm
                hover:bg-accent
                transition
              "

              role="menuitem"
            >

              <Settings
                className="
                  h-4
                  w-4
                  text-muted-foreground
                "
              />

              <span>
                Settings
              </span>

            </Link>


            {/* =============================================
                DIVIDER
            ============================================= */}

            <div
              className="
                h-px
                bg-border
                my-1
              "
            />


            {/* =============================================
                SIGN OUT
            ============================================= */}

            <button
              type="button"

              onClick={
                handleLogout
              }

              disabled={
                loggingOut
              }

              className="
                w-full
                flex
                items-center
                gap-3
                rounded-xl
                px-3
                py-2.5
                text-sm
                text-destructive
                hover:bg-destructive/10
                transition
                disabled:opacity-50
                disabled:cursor-not-allowed
              "

              role="menuitem"
            >

              <LogOut
                className="
                  h-4
                  w-4
                "
              />


              <span>

                {loggingOut
                  ? "Signing out..."
                  : "Sign out"}

              </span>

            </button>

          </div>

        </>

      )}

    </div>
  );
}