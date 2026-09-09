import { createFileRoute } from "@tanstack/react-router";

import {
  DashboardLayout,
  PageHeader,
} from "@/components/layout/DashboardLayout";

import {
  Card,
  Chip,
  StatCard,
} from "@/components/ui-kit";

import { apiRequest } from "@/api/client";

import { useRole } from "@/lib/roles";

import {
  Search,
  UserPlus,
  Users,
  ShieldAlert,
  UserCheck,
  Lock,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";


/* =========================================================
   ROUTE
========================================================= */

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      {
        title:
          "User Management — Netflix Show Manager",
      },

      {
        name:
          "description",

        content:
          "Administer studio accounts, roles and access status across the platform.",
      },

      {
        property:
          "og:title",

        content:
          "User Management — Netflix Show Manager",
      },

      {
        property:
          "og:description",

        content:
          "Administer studio accounts, roles and access status.",
      },
    ],
  }),

  component:
    UsersPage,
});


/* =========================================================
   TYPES
========================================================= */

interface RoleResponse {
  roleId: number;

  roleName: string;

  description?: string;
}


interface UserResponse {
  userId: number;

  fullName: string;

  username: string;

  email: string;

  phone?: string | null;

  employeeCode?: string | null;

  bio?: string | null;

  isActive?: boolean;

  role?: RoleResponse | null;
}


interface UserForm {
  fullName: string;

  username: string;

  email: string;

  password: string;

  phone: string;

  employeeCode: string;

  bio: string;

  roleId: string;
}


/* =========================================================
   EMPTY FORM
========================================================= */

const emptyForm: UserForm = {
  fullName: "",

  username: "",

  email: "",

  password: "",

  phone: "",

  employeeCode: "",

  bio: "",

  roleId: "",
};


/* =========================================================
   PAGE
========================================================= */

function UsersPage() {

  /*
   * IMPORTANT:
   *
   * Do NOT read profile here.
   *
   * The current roles.ts implementation only needs
   * can() for this page.
   */

  const {
    can,
  } = useRole();


  /* =======================================================
     STATE
  ======================================================= */

  const [
    users,
    setUsers,
  ] = useState<UserResponse[]>([]);


  const [
    roles,
    setRoles,
  ] = useState<RoleResponse[]>([]);


  const [
    query,
    setQuery,
  ] = useState("");


  const [
    roleFilter,
    setRoleFilter,
  ] = useState("ALL");


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    deletingId,
    setDeletingId,
  ] = useState<number | null>(null);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  const [
    showForm,
    setShowForm,
  ] = useState(false);


  const [
    editingUser,
    setEditingUser,
  ] = useState<UserResponse | null>(null);


  const [
    form,
    setForm,
  ] = useState<UserForm>(
    emptyForm
  );


  /* =======================================================
     ACCESS CHECK
  ======================================================= */

  const hasAccess =
    can("manage_users");


  /* =======================================================
     LOAD DATA
  ======================================================= */

  async function loadData() {

    try {

      setLoading(true);

      setError("");


      const [
        userData,
        roleData,
      ] = await Promise.all([

        apiRequest<UserResponse[]>(
          "/api/users"
        ),

        apiRequest<RoleResponse[]>(
          "/api/roles"
        ),

      ]);


      setUsers(
        Array.isArray(userData)
          ? userData
          : []
      );


      setRoles(
        Array.isArray(roleData)
          ? roleData
          : []
      );

    } catch (err) {

      console.error(
        "Failed to load users:",
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : "Failed to load users."
      );

    } finally {

      setLoading(false);

    }
  }


  /* =======================================================
     LOAD ON MOUNT
  ======================================================= */

  useEffect(() => {

    if (!hasAccess) {
      setLoading(false);
      return;
    }

    void loadData();

  }, [
    hasAccess,
  ]);


  /* =======================================================
     FILTER USERS
  ======================================================= */

  const filteredUsers =
    useMemo(() => {

      const search =
        query
          .trim()
          .toLowerCase();


      return users.filter(
        (user) => {

          const roleName =
            user.role?.roleName ||
            "";


          const matchesRole =
            roleFilter === "ALL" ||
            roleName === roleFilter;


          const searchable = [

            user.fullName,

            user.username,

            user.email,

            user.phone ?? "",

            user.employeeCode ?? "",

            user.bio ?? "",

            roleName,

          ]
            .join(" ")
            .toLowerCase();


          const matchesSearch =
            !search ||
            searchable.includes(
              search
            );


          return (
            matchesRole &&
            matchesSearch
          );
        }
      );

    }, [
      users,
      query,
      roleFilter,
    ]);


  /* =======================================================
     STATISTICS
  ======================================================= */

  const totalUsers =
    users.length;


  const activeUsers =
    users.filter(
      (user) =>
        user.isActive === true
    ).length;


  const inactiveUsers =
    users.filter(
      (user) =>
        user.isActive !== true
    ).length;


  const privilegedUsers =
    users.filter(
      (user) => {

        const role =
          user.role?.roleName;


        return (
          role === "ADMIN" ||
          role === "CONTENT_MANAGER"
        );
      }
    ).length;


  /* =======================================================
     CREATE FORM
  ======================================================= */

  function openCreateForm() {

    setEditingUser(null);


    setForm({
      ...emptyForm,

      roleId:
        roles.length > 0
          ? String(
              roles[0].roleId
            )
          : "",
    });


    setError("");

    setSuccess("");

    setShowForm(true);
  }


  /* =======================================================
     EDIT FORM
  ======================================================= */

  function openEditForm(
    user: UserResponse
  ) {

    setEditingUser(user);


    setForm({

      fullName:
        user.fullName || "",

      username:
        user.username || "",

      email:
        user.email || "",

      password:
        "",

      phone:
        user.phone || "",

      employeeCode:
        user.employeeCode || "",

      bio:
        user.bio || "",

      roleId:
        user.role?.roleId
          ? String(
              user.role.roleId
            )
          : "",
    });


    setError("");

    setSuccess("");

    setShowForm(true);
  }


  /* =======================================================
     CLOSE FORM
  ======================================================= */

  function closeForm() {

    if (saving) {
      return;
    }


    setShowForm(false);

    setEditingUser(null);

    setForm({
      ...emptyForm,
    });
  }


  /* =======================================================
     UPDATE FORM
  ======================================================= */

  function updateForm(
    field: keyof UserForm,
    value: string
  ) {

    setForm(
      (previous) => ({
        ...previous,

        [field]:
          value,
      })
    );
  }


  /* =======================================================
     VALIDATION
  ======================================================= */

  function validateForm(): string {

    if (
      form.fullName
        .trim()
        .length < 2
    ) {

      return (
        "Full name must contain at least 2 characters."
      );
    }


    if (
      form.fullName
        .trim()
        .length > 100
    ) {

      return (
        "Full name cannot exceed 100 characters."
      );
    }


    if (
      form.username
        .trim()
        .length < 3
    ) {

      return (
        "Username must contain at least 3 characters."
      );
    }


    if (
      form.username
        .trim()
        .length > 50
    ) {

      return (
        "Username cannot exceed 50 characters."
      );
    }


    if (
      !form.email.trim()
    ) {

      return (
        "Email is required."
      );
    }


    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {

      return (
        "Enter a valid email address."
      );
    }


    /*
     * Password required for CREATE.
     */

    if (!editingUser) {

      if (
        form.password.length <
        6
      ) {

        return (
          "Password must contain at least 6 characters."
        );
      }

    }


    /*
     * Password optional for EDIT.
     */

    if (
      editingUser &&
      form.password &&
      form.password.length < 6
    ) {

      return (
        "New password must contain at least 6 characters."
      );
    }


    if (
      form.phone &&
      !/^[0-9]{10}$/.test(
        form.phone
      )
    ) {

      return (
        "Phone number must contain exactly 10 digits."
      );
    }


    if (
      form.employeeCode.length >
      50
    ) {

      return (
        "Employee code cannot exceed 50 characters."
      );
    }


    if (
      form.bio.length >
      500
    ) {

      return (
        "Bio cannot exceed 500 characters."
      );
    }


    if (
      !form.roleId ||
      Number(form.roleId) <= 0
    ) {

      return (
        "Please select a role."
      );
    }


    return "";
  }


  /* =======================================================
     SAVE USER
  ======================================================= */

  async function saveUser(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();


    setError("");

    setSuccess("");


    const validationError =
      validateForm();


    if (validationError) {

      setError(
        validationError
      );

      return;
    }


    setSaving(true);


    try {

      const payload: Record<
        string,
        unknown
      > = {

        fullName:
          form.fullName.trim(),

        username:
          form.username.trim(),

        email:
          form.email.trim(),

        phone:
          form.phone.trim() ||
          null,

        employeeCode:
          form.employeeCode.trim() ||
          null,

        bio:
          form.bio.trim() ||
          null,

        roleId:
          Number(form.roleId),

      };


      /*
       * Password:
       *
       * CREATE -> required
       *
       * EDIT -> send only when changed
       */

      if (
        !editingUser ||
        form.password.trim()
      ) {

        payload.password =
          form.password;
      }


      if (editingUser) {

        const response =
          await apiRequest<UserResponse>(
            `/api/users/${editingUser.userId}`,
            {
              method:
                "PUT",

              body:
                JSON.stringify(
                  payload
                ),
            }
          );


        setUsers(
          (previous) =>
            previous.map(
              (user) =>
                user.userId ===
                editingUser.userId
                  ? response
                  : user
            )
        );


        setSuccess(
          "User updated successfully."
        );

      } else {

        const response =
          await apiRequest<UserResponse>(
            "/api/users",
            {
              method:
                "POST",

              body:
                JSON.stringify(
                  payload
                ),
            }
          );


        setUsers(
          (previous) => [
            ...previous,
            response,
          ]
        );


        setSuccess(
          "User created successfully."
        );
      }


      setShowForm(false);

      setEditingUser(null);

      setForm({
        ...emptyForm,
      });

    } catch (err) {

      console.error(
        "Failed to save user:",
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : "Failed to save user."
      );

    } finally {

      setSaving(false);

    }
  }


  /* =======================================================
     DELETE USER
  ======================================================= */

  async function deleteUser(
    user: UserResponse
  ) {

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${user.fullName}"?`
      );


    if (!confirmed) {
      return;
    }


    setDeletingId(
      user.userId
    );


    setError("");

    setSuccess("");


    try {

      await apiRequest<void>(
        `/api/users/${user.userId}`,
        {
          method:
            "DELETE",
        }
      );


      setUsers(
        (previous) =>
          previous.filter(
            (item) =>
              item.userId !==
              user.userId
          )
      );


      setSuccess(
        "User deleted successfully."
      );

    } catch (err) {

      console.error(
        "Failed to delete user:",
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete user."
      );

    } finally {

      setDeletingId(null);

    }
  }


  /* =======================================================
     ACCESS DENIED
  ======================================================= */

  if (!hasAccess) {

    return (
      <DashboardLayout>

        <div
          className="
            min-h-[60vh]
            grid
            place-items-center
          "
        >

          <Card
            className="
              max-w-md
              text-center
              py-12
            "
          >

            <div
              className="
                mx-auto
                h-14
                w-14
                grid
                place-items-center
                rounded-2xl
                bg-destructive/15
                text-destructive
                mb-5
              "
            >

              <Lock
                className="
                  h-7
                  w-7
                "
              />

            </div>


            <h2
              className="
                text-xl
                font-bold
              "
            >
              Access restricted
            </h2>


            <p
              className="
                text-sm
                text-muted-foreground
                mt-2
              "
            >
              User management is available
              only to administrators.
            </p>

          </Card>

        </div>

      </DashboardLayout>
    );
  }


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {

    return (
      <DashboardLayout>

        <PageHeader
          title="User Management"
          description="Loading users and roles..."
        />


        <div
          className="
            grid
            sm:grid-cols-2
            xl:grid-cols-4
            gap-4
            mb-6
          "
        >

          {Array.from({
            length: 4,
          }).map(
            (_, index) => (

              <Card
                key={index}
                className="animate-pulse"
              >

                <div
                  className="
                    h-3
                    w-24
                    rounded
                    bg-muted
                  "
                />

                <div
                  className="
                    mt-4
                    h-8
                    w-16
                    rounded
                    bg-muted
                  "
                />

              </Card>

            )
          )}

        </div>


        <Card
          className="animate-pulse"
        >

          <div
            className="
              h-10
              rounded
              bg-muted
            "
          />

        </Card>

      </DashboardLayout>
    );
  }


  /* =======================================================
     MAIN PAGE
  ======================================================= */

  return (
    <DashboardLayout>

      <PageHeader
        title="User Management"
        description="Accounts, roles and access information across the studio."
        actions={

          <button
            type="button"
            onClick={
              openCreateForm
            }
            className="
              h-10
              px-4
              rounded-xl
              bg-primary
              text-primary-foreground
              text-sm
              font-semibold
              inline-flex
              items-center
              gap-2
              hover:opacity-90
              transition
              shadow-[var(--shadow-glow)]
            "
          >

            <UserPlus
              className="
                h-4
                w-4
              "
            />

            Create user

          </button>
        }
      />


      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (

        <div
          className="
            mb-4
            rounded-xl
            border
            border-destructive/30
            bg-destructive/10
            p-4
            flex
            items-start
            gap-3
          "
        >

          <AlertCircle
            className="
              h-5
              w-5
              text-destructive
              shrink-0
            "
          />

          <div
            className="
              text-sm
              text-destructive
            "
          >
            {error}
          </div>


          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="
              ml-auto
              text-destructive
            "
          >

            <X
              className="
                h-4
                w-4
              "
            />

          </button>

        </div>
      )}


      {/* ===================================================
          SUCCESS
      =================================================== */}

      {success && (

        <div
          className="
            mb-4
            rounded-xl
            border
            border-green-500/30
            bg-green-500/10
            p-4
            text-sm
            text-green-500
          "
        >
          {success}
        </div>
      )}


      {/* ===================================================
          STATS
      =================================================== */}

      <div
        className="
          grid
          sm:grid-cols-2
          xl:grid-cols-4
          gap-4
          mb-6
        "
      >

        <StatCard
          label="Total accounts"
          value={
            String(totalUsers)
          }
          icon={
            <Users
              className="
                h-5
                w-5
              "
            />
          }
          accent="primary"
        />


        <StatCard
          label="Active"
          value={
            String(activeUsers)
          }
          icon={
            <UserCheck
              className="
                h-5
                w-5
              "
            />
          }
          accent="success"
        />


        <StatCard
          label="Inactive"
          value={
            String(inactiveUsers)
          }
          icon={
            <Lock
              className="
                h-5
                w-5
              "
            />
          }
          accent="warning"
        />


        <StatCard
          label="Privileged roles"
          value={
            String(
              privilegedUsers
            )
          }
          icon={
            <ShieldAlert
              className="
                h-5
                w-5
              "
            />
          }
          accent="info"
        />

      </div>


      {/* ===================================================
          SEARCH / FILTER
      =================================================== */}

      <Card className="mb-6">

        <div
          className="
            flex
            flex-wrap
            items-center
            gap-3
          "
        >

          <div
            className="
              relative
              min-w-0
              flex-1
            "
          >

            <Search
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                h-4
                w-4
                text-muted-foreground
              "
            />


            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="
                Search by name, username, email, employee code or role...
              "
              className={`
                w-full
                h-10
                pl-10
                pr-3
                rounded-xl
                bg-surface
                border
                border-border
                text-sm
                focus:outline-none
                focus:ring-2
                focus:ring-ring
              `}
            />

          </div>


          <div
            className="
              flex
              flex-wrap
              gap-1.5
            "
          >

            <button
              type="button"
              onClick={() =>
                setRoleFilter(
                  "ALL"
                )
              }
              className={cn(
                "h-9 px-3 rounded-lg text-xs font-medium transition border",

                roleFilter ===
                  "ALL"
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "border-border hover:bg-accent"
              )}
            >
              All roles
            </button>


            {roles.map(
              (role) => (

                <button
                  key={
                    role.roleId
                  }
                  type="button"
                  onClick={() =>
                    setRoleFilter(
                      role.roleName
                    )
                  }
                  className={cn(
                    "h-9 px-3 rounded-lg text-xs font-medium transition border",

                    roleFilter ===
                      role.roleName
                      ? "bg-primary text-primary-foreground border-transparent"
                      : "border-border hover:bg-accent"
                  )}
                >
                  {formatRoleName(
                    role.roleName
                  )}
                </button>

              )
            )}

          </div>

        </div>

      </Card>


      {/* ===================================================
          USERS TABLE
      =================================================== */}

      <Card
        className="
          !p-0
          overflow-hidden
        "
      >

        <div
          className="
            overflow-x-auto
            scrollbar-thin
          "
        >

          <table
            className="
              w-full
              text-sm
            "
          >

            <thead
              className="
                text-left
                text-xs
                uppercase
                tracking-wider
                text-muted-foreground
                bg-surface-elevated/40
              "
            >

              <tr>

                <th className="p-4">
                  User
                </th>

                <th className="p-4">
                  Employee Code
                </th>

                <th className="p-4">
                  Role
                </th>

                <th className="p-4">
                  Phone
                </th>

                <th className="p-4">
                  Status
                </th>

                <th
                  className="
                    p-4
                    text-right
                  "
                >
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredUsers.map(
                (user) => (

                  <tr
                    key={
                      user.userId
                    }
                    className="
                      border-t
                      border-border
                      hover:bg-accent/40
                      transition
                    "
                  >

                    {/* USER */}

                    <td className="p-4">

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
                            bg-primary/10
                            text-primary
                            grid
                            place-items-center
                            shrink-0
                            font-semibold
                          "
                        >
                          {getInitials(
                            user.fullName
                          )}
                        </div>


                        <div
                          className="
                            min-w-0
                          "
                        >

                          <div
                            className="
                              font-medium
                              truncate
                            "
                          >
                            {
                              user.fullName
                            }
                          </div>


                          <div
                            className="
                              text-xs
                              text-muted-foreground
                              truncate
                            "
                          >
                            @
                            {
                              user.username
                            }
                          </div>


                          <div
                            className="
                              text-xs
                              text-muted-foreground
                              truncate
                            "
                          >
                            {
                              user.email
                            }
                          </div>

                        </div>

                      </div>

                    </td>


                    {/* EMPLOYEE CODE */}

                    <td className="p-4">

                      <span
                        className="
                          font-mono
                          text-xs
                          text-muted-foreground
                        "
                      >
                        {
                          user.employeeCode ||
                          "—"
                        }
                      </span>

                    </td>


                    {/* ROLE */}

                    <td className="p-4">

                      <Chip
                        variant="info"
                      >
                        {formatRoleName(
                          user.role
                            ?.roleName
                        )}
                      </Chip>

                    </td>


                    {/* PHONE */}

                    <td
                      className="
                        p-4
                        text-muted-foreground
                      "
                    >
                      {
                        user.phone ||
                        "—"
                      }
                    </td>


                    {/* STATUS */}

                    <td className="p-4">

                      <Chip
                        variant={
                          user.isActive
                            ? "success"
                            : "danger"
                        }
                      >
                        {user.isActive
                          ? "Active"
                          : "Inactive"}
                      </Chip>

                    </td>


                    {/* ACTIONS */}

                    <td className="p-4">

                      <div
                        className="
                          flex
                          justify-end
                          gap-1.5
                        "
                      >

                        <button
                          type="button"
                          title="Edit user"
                          onClick={() =>
                            openEditForm(
                              user
                            )
                          }
                          className="
                            h-8
                            px-3
                            rounded-lg
                            border
                            border-border
                            text-xs
                            inline-flex
                            items-center
                            gap-1.5
                            hover:bg-accent
                            transition
                          "
                        >

                          <Pencil
                            className="
                              h-3.5
                              w-3.5
                            "
                          />

                          Edit

                        </button>


                        <button
                          type="button"
                          title="Delete user"
                          disabled={
                            deletingId ===
                            user.userId
                          }
                          onClick={() =>
                            void deleteUser(
                              user
                            )
                          }
                          className="
                            h-8
                            px-3
                            rounded-lg
                            border
                            border-border
                            text-xs
                            inline-flex
                            items-center
                            gap-1.5
                            hover:bg-destructive/20
                            hover:text-destructive
                            transition
                            disabled:opacity-50
                          "
                        >

                          {deletingId ===
                          user.userId ? (

                            <Loader2
                              className="
                                h-3.5
                                w-3.5
                                animate-spin
                              "
                            />

                          ) : (

                            <Trash2
                              className="
                                h-3.5
                                w-3.5
                              "
                            />

                          )}

                          Delete

                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>


        {/* =================================================
            EMPTY
        ================================================= */}

        {filteredUsers.length ===
          0 && (

          <div
            className="
              p-12
              text-center
            "
          >

            <Users
              className="
                h-8
                w-8
                mx-auto
                text-muted-foreground/50
                mb-3
              "
            />


            <div
              className="
                text-sm
                font-medium
              "
            >
              No users found
            </div>


            <div
              className="
                text-xs
                text-muted-foreground
                mt-1
              "
            >
              Try changing your search
              or role filter.
            </div>

          </div>
        )}


        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          className="
            p-4
            border-t
            border-border
            text-xs
            text-muted-foreground
            flex
            justify-between
            gap-3
          "
        >

          <span>
            Showing{" "}
            {
              filteredUsers.length
            }{" "}
            of{" "}
            {users.length} users
          </span>


          <span>
            {roles.length} roles
            available
          </span>

        </div>

      </Card>


      {/* ===================================================
          CREATE / EDIT MODAL
      =================================================== */}

      {showForm && (

        <div
          className="
            fixed
            inset-0
            z-50
            bg-black/60
            backdrop-blur-sm
            flex
            items-center
            justify-center
            p-4
          "
        >

          <div
            className="
              w-full
              max-w-2xl
              max-h-[90vh]
              overflow-y-auto
              rounded-2xl
              border
              border-border
              bg-background
              shadow-2xl
            "
          >

            {/* HEADER */}

            <div
              className="
                p-5
                border-b
                border-border
                flex
                items-center
                justify-between
                gap-3
              "
            >

              <div>

                <div
                  className="
                    text-lg
                    font-semibold
                  "
                >
                  {editingUser
                    ? "Edit User"
                    : "Create User"}
                </div>


                <div
                  className="
                    text-xs
                    text-muted-foreground
                    mt-1
                  "
                >
                  {editingUser
                    ? "Update account details, role or password."
                    : "Create a new StreamForge user account."}
                </div>

              </div>


              <button
                type="button"
                onClick={
                  closeForm
                }
                disabled={saving}
                className="
                  h-9
                  w-9
                  rounded-lg
                  grid
                  place-items-center
                  hover:bg-accent
                  transition
                "
              >

                <X
                  className="
                    h-4
                    w-4
                  "
                />

              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={
                saveUser
              }
              className="
                p-5
                space-y-5
              "
            >

              {/* NAME + USERNAME */}

              <div
                className="
                  grid
                  sm:grid-cols-2
                  gap-4
                "
              >

                <FormField
                  label="Full name"
                  required
                >

                  <input
                    value={
                      form.fullName
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "fullName",
                        event.target
                          .value
                      )
                    }
                    maxLength={100}
                    placeholder="John Doe"
                    className={
                      inputClass
                    }
                  />

                </FormField>


                <FormField
                  label="Username"
                  required
                >

                  <input
                    value={
                      form.username
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "username",
                        event.target
                          .value
                      )
                    }
                    minLength={3}
                    maxLength={50}
                    placeholder="john.doe"
                    className={
                      inputClass
                    }
                  />

                </FormField>

              </div>


              {/* EMAIL + PHONE */}

              <div
                className="
                  grid
                  sm:grid-cols-2
                  gap-4
                "
              >

                <FormField
                  label="Email"
                  required
                >

                  <input
                    type="email"
                    value={
                      form.email
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "email",
                        event.target
                          .value
                      )
                    }
                    placeholder="john@example.com"
                    className={
                      inputClass
                    }
                  />

                </FormField>


                <FormField
                  label="Phone"
                >

                  <input
                    inputMode="numeric"
                    value={
                      form.phone
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "phone",
                        event.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    maxLength={10}
                    placeholder="9876543210"
                    className={
                      inputClass
                    }
                  />

                </FormField>

              </div>


              {/* PASSWORD + ROLE */}

              <div
                className="
                  grid
                  sm:grid-cols-2
                  gap-4
                "
              >

                <FormField
                  label={
                    editingUser
                      ? "New password"
                      : "Password"
                  }
                  required={
                    !editingUser
                  }
                >

                  <input
                    type="password"
                    value={
                      form.password
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "password",
                        event.target
                          .value
                      )
                    }
                    minLength={6}
                    maxLength={100}
                    placeholder={
                      editingUser
                        ? "Leave blank to keep current"
                        : "Minimum 6 characters"
                    }
                    className={
                      inputClass
                    }
                  />

                </FormField>


                <FormField
                  label="Role"
                  required
                >

                  <select
                    value={
                      form.roleId
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "roleId",
                        event.target
                          .value
                      )
                    }
                    className={
                      inputClass
                    }
                  >

                    <option value="">
                      Select role
                    </option>


                    {roles.map(
                      (role) => (

                        <option
                          key={
                            role.roleId
                          }
                          value={
                            role.roleId
                          }
                        >
                          {formatRoleName(
                            role.roleName
                          )}
                        </option>

                      )
                    )}

                  </select>

                </FormField>

              </div>


              {/* EMPLOYEE CODE */}

              <FormField
                label="Employee code"
              >

                <input
                  value={
                    form.employeeCode
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "employeeCode",
                      event.target
                        .value
                    )
                  }
                  maxLength={50}
                  placeholder="EMP-001"
                  className={
                    inputClass
                  }
                />

              </FormField>


              {/* BIO */}

              <FormField
                label="Bio"
              >

                <textarea
                  value={
                    form.bio
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "bio",
                      event.target
                        .value
                    )
                  }
                  maxLength={500}
                  rows={4}
                  placeholder="Short description..."
                  className={`
                    ${inputClass}
                    py-3
                    resize-none
                  `}
                />


                <div
                  className="
                    mt-1
                    text-right
                    text-[10px]
                    text-muted-foreground
                  "
                >
                  {
                    form.bio.length
                  }
                  /500
                </div>

              </FormField>


              {/* FORM ERROR */}

              {error && (

                <div
                  className="
                    rounded-xl
                    border
                    border-destructive/30
                    bg-destructive/10
                    p-3
                    text-sm
                    text-destructive
                  "
                >
                  {error}
                </div>

              )}


              {/* ACTIONS */}

              <div
                className="
                  pt-2
                  flex
                  justify-end
                  gap-2
                "
              >

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  className="
                    h-10
                    px-4
                    rounded-xl
                    border
                    border-border
                    text-sm
                    hover:bg-accent
                    transition
                  "
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="
                    h-10
                    px-5
                    rounded-xl
                    bg-primary
                    text-primary-foreground
                    text-sm
                    font-semibold
                    inline-flex
                    items-center
                    gap-2
                    hover:opacity-90
                    transition
                    disabled:opacity-60
                  "
                >

                  {saving ? (

                    <>
                      <Loader2
                        className="
                          h-4
                          w-4
                          animate-spin
                        "
                      />

                      Saving...
                    </>

                  ) : (

                    <>
                      <Save
                        className="
                          h-4
                          w-4
                        "
                      />

                      {editingUser
                        ? "Update user"
                        : "Create user"}
                    </>

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </DashboardLayout>
  );
}


/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  required,
  children,
}: {
  label: string;

  required?: boolean;

  children: ReactNode;
}) {

  return (
    <label
      className="
        block
      "
    >

      <div
        className="
          mb-1.5
          text-xs
          font-medium
          uppercase
          tracking-wider
          text-muted-foreground
        "
      >

        {label}

        {required && (

          <span
            className="
              text-destructive
              ml-1
            "
          >
            *
          </span>

        )}

      </div>


      {children}

    </label>
  );
}


/* =========================================================
   INPUT CLASS
========================================================= */

const inputClass = `
  w-full
  h-11
  px-3.5
  rounded-xl
  bg-surface
  border
  border-border
  text-sm
  focus:outline-none
  focus:ring-2
  focus:ring-ring
`;


/* =========================================================
   ROLE FORMATTER
========================================================= */

function formatRoleName(
  roleName?: string
): string {

  if (!roleName) {
    return "No role";
  }


  return roleName
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}


/* =========================================================
   INITIALS
========================================================= */

function getInitials(
  name?: string
): string {

  if (!name) {
    return "?";
  }


  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);


  if (
    parts.length === 1
  ) {

    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }


  return (
    parts[0].charAt(0) +
    parts[
      parts.length - 1
    ].charAt(0)
  ).toUpperCase();
}