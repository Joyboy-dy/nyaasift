import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { EXTENSION_HELP_URL } from "#/lib/links";
import { auth, authReady, userCount } from "#/server/auth";
import { env } from "#/server/env";

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
  async (): Promise<{
    viewer: Viewer | null;
    needsSetup: boolean;
    extension: { url: string; published: boolean };
  }> => {
    await authReady;
    const needsSetup = userCount() === 0;
    const extension = env.chromeExtensionUrl
      ? { url: env.chromeExtensionUrl, published: true }
      : { url: EXTENSION_HELP_URL, published: false };
    const session = await auth.api.getSession({ headers: getRequestHeaders() });
    if (!session) return { viewer: null, needsSetup, extension };
    const role = ((session.user as { role?: string }).role ?? "user") as Role;
    return {
      needsSetup,
      extension,
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
