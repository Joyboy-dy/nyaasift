import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth, authReady, userCount } from "#/server/auth";

export type Role = "user" | "admin" | "superadmin";
export type Viewer = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

/** Qui est connecté (null sinon), et si le site attend encore son premier compte. */
export const getViewer = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ viewer: Viewer | null; needsSetup: boolean }> => {
    await authReady;
    const needsSetup = userCount() === 0;
    const session = await auth.api.getSession({ headers: getRequestHeaders() });
    if (!session) return { viewer: null, needsSetup };
    const role = ((session.user as { role?: string }).role ?? "user") as Role;
    return {
      needsSetup,
      viewer: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role,
        isAdmin: role === "admin" || role === "superadmin",
        isSuperAdmin: role === "superadmin",
      },
    };
  },
);
