import { API } from "@core/network/supabase/api";
import { Auth, CreateUserBody, LoginBody } from "./types.auth";
import {
  mapLegacyRoleToAppRoles,
  pickPrimaryRole,
  type LegacyRole,
} from "@core/domain/rbac";

export const registerUser = (user: CreateUserBody) => {
  const { email, password, ...rest } = user;
  return API.auth.signUp({
    email,
    password,
    options: {
      data: {
        ...rest,
      },
    },
  });
};

export const getCurrentAuth = async (): Promise<Auth | null> => {
  try {
    let session;
    let error;

    try {
      const result = await API.auth.getSession();
      session = result.data?.session;
      error = result.error;
    } catch (err: any) {
      await API.auth.signOut().catch(() => {});
      return null;
    }

    if (error) {
      await API.auth.signOut().catch(() => {});
      return null;
    }

    if (!session || !session.user) {
      return null;
    }
    const { user } = session;
    const { data: profile } = await API.from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      throw new Error("Profile not found for current user");
    }

    // Legacy compatibility: current schema exposes role {student, docent}.
    // New SaaS schema will provide app_roles via user_roles.
    const legacyRole = (profile as any).role as LegacyRole | undefined;
    const appRoles = legacyRole ? mapLegacyRoleToAppRoles(legacyRole) : ["student"];
    return {
      user: {
        email: user.email ?? "",
        ...profile,
        app_roles: appRoles,
        app_role: pickPrimaryRole(appRoles),
      },
      session,
    };
  } catch (error: any) {
    await API.auth.signOut().catch(() => {});
    return null;
  }
};

export const login = async ({ email, password }: LoginBody): Promise<Auth> => {
  const { data, error } = await API.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (!data || !data.user) {
    throw new Error("User not found after login");
  }

  const auth = await getCurrentAuth();

  if (!auth) {
    throw new Error("Failed to retrieve auth after login");
  }

  return auth;
};

export const logout = async () => {
  return API.auth.signOut();
};
