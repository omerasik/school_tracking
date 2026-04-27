import { TablesInsert } from "@core/network/supabase/database.types";
import { Session } from "@supabase/supabase-js";
import { Profile } from "../profiles/types.profiles";
import { AppRole } from "@core/domain/rbac";

type CreateProfileBody = Omit<TablesInsert<"profiles">, "id">;

export type Auth = {
  session: Session;
  user: User;
};

export type User = {
  email: string;
} & Profile &
  UserSaasClaims;

// Progressive enhancement: new SaaS roles are exposed without breaking legacy screens
export type UserSaasClaims = {
  tenant_id?: string | null;
  school_id?: string | null;
  app_roles?: AppRole[];
  app_role?: AppRole;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type CreateUserBody = {
  email: string;
  password: string;
} & CreateProfileBody;