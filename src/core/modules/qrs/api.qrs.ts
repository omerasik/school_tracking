import { API } from "@core/network/supabase/api";
import { Qr } from "./types.qrs";

export const getQrs = async (): Promise<Qr[]> => {
  const { data } = await API.from("qr_codes")
    .select("*")
    .order("created_at", { ascending: false })
    .throwOnError();
  return Promise.resolve(data);
};

export const getQrById = async (id: number): Promise<Qr | null> => {
  const response = await API.from("qr_codes")
    .select("*")
    .eq("id", id)
    .throwOnError()
    .single();
  return Promise.resolve(response.data);
};
