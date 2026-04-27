import { API } from "@core/network/supabase/api";
import { CourseWithCampus } from "./types.courses";

export const getCourses = async (): Promise<CourseWithCampus[]> => {
  const { data } = await API.from("courses")
    .select("*, campuses(*)")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .throwOnError();
  return Promise.resolve(data);
};

export const getUpcomingCourses = async (): Promise<CourseWithCampus[]> => {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await API.from("courses")
    .select("*, campuses(*)")
    .gte("date", today)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .throwOnError();
  return Promise.resolve(data);
};

export const getTodayCourses = async (): Promise<CourseWithCampus[]> => {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await API.from("courses")
    .select("*, campuses(*)")
    .eq("date", today)
    .order("start_time", { ascending: true })
    .throwOnError();
  return Promise.resolve(data);
};

export const getCourseById = async (
  id: number
): Promise<CourseWithCampus | null> => {
  const response = await API.from("courses")
    .select("*, campuses(*)")
    .eq("id", id)
    .throwOnError()
    .single();
  return Promise.resolve(response.data);
};

/**
 * Get the current active course based on current time
 * Returns null if no course is active right now
 */
export const getCurrentCourse = async (): Promise<CourseWithCampus | null> => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().substring(0, 8); // HH:MM:SS format

  const { data } = await API.from("courses")
    .select("*, campuses(*)")
    .eq("date", today)
    .lte("start_time", currentTime)
    .gte("end_time", currentTime)
    .maybeSingle();

  return Promise.resolve(data);
};
