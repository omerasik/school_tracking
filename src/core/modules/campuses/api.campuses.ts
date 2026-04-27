import { API } from "@core/network/supabase/api";
import { Campus } from "./types.campuses";

export const getCampusById = async (id: number): Promise<Campus | null> => {
  const { data } = await API.from("campuses")
    .select("*")
    .eq("id", id)
    .single()
    .throwOnError();
  return Promise.resolve(data);
};

export const getAllCampuses = async (): Promise<Campus[]> => {
  const { data, error } = await API.from("campuses").select("*");

  if (error) {
    console.error("Error fetching campuses:", error);
    return [];
  }

  return data || [];
};
