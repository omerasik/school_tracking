import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@core/network/supabase/database.types";

export type Qr = Tables<"qr_codes">;

export type CreateQrBody = TablesInsert<"qr_codes">;
export type UpdateQrBody = TablesUpdate<"qr_codes">;