import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Clapperboard, Eye, EyeOff, Github } from "lucide-react";
import { useState, type ReactNode, type FormEvent } from "react";
import { apiRequest } from "../api/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

interface LoginUser {
  userId?: number;
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  employeeCode?: string;
  bio?: string;
  role?:
    | string
    | {
        roleId?: number;
        roleName?: string;
        description?: string;
      };
}

interface LoginResponse {
  accessToken: string;
  user: LoginUser;
}

function LoginPage() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");

  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest<LoginResponse>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        }
      );

      console.log("Login response:", response);

      /*
       * Backend LoginResponse:
       *
       * {
       *   "accessToken": "eyJ...",
       *   "user": {
       *      ...
       *   }
       * }
       */

      if (!response?.accessToken) {
        throw new Error(
          "Login succeeded but no authentication token was returned."
        );
      }

      // --------------------------------------------------
      // Store JWT
      // --------------------------------------------------

      const storage = rememberMe
        ? localStorage
        : sessionStorage;

      storage.setItem(
        "streamforge_token",
        response.accessToken
      );

      // Also remove an old token from the other storage
      if (rememberMe) {
        sessionStorage.removeItem("streamforge_token");
      } else {
        localStorage.removeItem("streamforge_token");
      }

      // --------------------------------------------------
      // Store user
      // --------------------------------------------------

      if (response.user) {
        storage.setItem(
          "streamforge_user",
          JSON.stringify(response.user)
        );

        if (response.user.username) {
          storage.setItem(
            "streamforge_username",
            response.user.username
          );
        }

        if (response.user.email) {
          storage.setItem(
            "streamforge_email",
            response.user.email
          );
        }

        if (response.user.userId !== undefined) {
          storage.setItem(
            "streamforge_user_id",
            String(response.user.userId)
          );
        }

        // --------------------------------------------------
        // Extract role
        // --------------------------------------------------

        let role = "";

        if (typeof response.user.role === "string") {
          role = response.user.role;
        } else if (response.user.role?.roleName) {
          role = response.user.role.roleName;
        }

        if (role) {
          role = role.toUpperCase();

          storage.setItem(
            "streamforge_role",
            role
          );
        }

        console.log("Logged-in user:", response.user);
        console.log("User role:", role);
      }

      // --------------------------------------------------
      // Successful login
      // --------------------------------------------------

      await navigate({
        to: "/dashboard",
      });
    } catch (err) {
      console.error("Login failed:", err);

      if (err instanceof Error) {
        setError(
          err.message || "Invalid username or password."
        );
      } else {
        setError("Invalid username or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">

      {/* ==================================================
          LEFT SIDE - CINEMATIC IMAGE
          ================================================== */}

      <div className="relative hidden lg:block overflow-hidden">

        <img
          src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600&auto=format"
          alt="Cinema production"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.14 0 0 / 0.6), oklch(0.14 0 0 / 0.9))",
          }}
        />

        <div className="relative z-10 h-full flex flex-col justify-between p-12">

          {/* Logo */}

          <div className="flex items-center gap-2">

            <div className="h-9 w-9 grid place-items-center rounded-xl bg-primary shadow-[var(--shadow-glow)]">
              <Clapperboard className="h-5 w-5 text-primary-foreground" />
            </div>

            <div className="leading-tight">
              <div className="text-sm font-bold tracking-wide">
                NETFLIX
              </div>

              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Show Manager
              </div>
            </div>

          </div>

          {/* Bottom message */}

          <div>

            <h2 className="text-4xl font-bold max-w-md leading-tight">
              The stage is set. Ready when you are.
            </h2>

            <p className="text-muted-foreground mt-4 max-w-md">
              Producers, directors and creators use Show Manager
              to move every original from concept to screen.
            </p>

          </div>

        </div>
      </div>


      {/* ==================================================
          RIGHT SIDE - LOGIN FORM
          ================================================== */}

      <div className="flex items-center justify-center p-6 md:p-10">

        <div className="w-full max-w-md">

          {/* Mobile logo */}

          <div className="lg:hidden flex items-center gap-2 mb-8">

            <div className="h-9 w-9 grid place-items-center rounded-xl bg-primary">
              <Clapperboard className="h-5 w-5" />
            </div>

            <div className="text-sm font-bold">
              NETFLIX SHOW MANAGER
            </div>

          </div>


          {/* Heading */}

          <h1 className="text-3xl font-bold">
            Welcome back
          </h1>

          <p className="text-sm text-muted-foreground mt-2">
            Sign in to your studio workspace.
          </p>


          <form
            onSubmit={handleLogin}
            className="mt-8 space-y-4"
          >

            {/* SSO */}

            <button
              type="button"
              disabled={loading}
              className="w-full h-11 rounded-xl border border-border hover:bg-accent transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <Github className="h-4 w-4" />

              Continue with SSO
            </button>


            {/* Divider */}

            <div className="flex items-center gap-3 text-xs text-muted-foreground">

              <div className="h-px flex-1 bg-border" />

              <span>or with email</span>

              <div className="h-px flex-1 bg-border" />

            </div>


            {/* Username */}

            <Field label="Username">

              <input
                type="text"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError("");
                }}
                autoComplete="username"
                placeholder="Enter your username"
                disabled={loading}
                className="input"
              />

            </Field>


            {/* Password */}

            <Field
              label="Password"
              trailing={
                <Link
                  to="/login"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot?
                </Link>
              }
            >

              <div className="relative">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  disabled={loading}
                  className="input pr-10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}

                </button>

              </div>

            </Field>


            {/* Remember me */}

            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) =>
                  setRememberMe(
                    event.target.checked
                  )
                }
                disabled={loading}
                className="accent-primary"
              />

              Keep me signed in on this device

            </label>


            {/* Error */}

            {error && (
              <div
                className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                role="alert"
              >
                {error}
              </div>
            )}


            {/* Sign in */}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition flex items-center justify-center shadow-[var(--shadow-glow)] disabled:opacity-60 disabled:cursor-not-allowed"
            >

              {loading ? (
                <div className="flex items-center gap-2">

                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />

                  Signing in...

                </div>
              ) : (
                "Sign in"
              )}

            </button>


            {/* Register */}

            <p className="text-xs text-center text-muted-foreground">

              Don't have an account?{" "}

              <Link
                to="/register"
                className="text-primary hover:underline"
              >
                Request access
              </Link>

            </p>

          </form>

        </div>

      </div>


      {/* ==================================================
          INPUT STYLES
          ================================================== */}

      <style>
        {`
          .input {
            width: 100%;
            height: 44px;
            padding: 0 14px;
            border-radius: 12px;
            background: var(--surface);
            border: 1px solid var(--border);
            color: inherit;
            font-size: 14px;
            outline: none;
            transition:
              border-color 0.2s,
              box-shadow 0.2s;
          }

          .input:focus {
            border-color: transparent;
            box-shadow: 0 0 0 2px var(--ring);
          }

          .input:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .input::placeholder {
            color: var(--muted-foreground);
          }
        `}
      </style>

    </div>
  );
}


/* ======================================================
   FIELD COMPONENT
   ====================================================== */

function Field({
  label,
  trailing,
  children,
}: {
  label: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">

      <div className="flex items-center justify-between mb-1.5">

        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>

        {trailing}

      </div>

      {children}

    </label>
  );
}