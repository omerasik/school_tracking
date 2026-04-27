import { API } from "@core/network/supabase/api";
import { AttendanceWithProfile } from "./types.attendances";

export const getAttendances = async (): Promise<AttendanceWithProfile[]> => {
  const { data } = await API.from("attendances")
    .select("*, profiles(*), campuses(*), courses(*)")
    .order("date", { ascending: false })
    .throwOnError();
  return Promise.resolve(data);
};

export const getAttendanceById = async (
  uid: number
): Promise<AttendanceWithProfile | null> => {
  const response = await API.from("attendances")
    .select("*, profiles(*), campuses(*), courses(*)")
    .eq("id", uid)
    .throwOnError()
    .single();
  return Promise.resolve(response.data);
};

/**
 * Auto checkout students whose course has ended
 * Sets is_present to false and adds check_out_time
 */
export const autoCheckoutExpiredAttendances = async (): Promise<void> => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().substring(0, 8); // HH:MM:SS

  // Find all attendances that are still present but their course has ended
  const { data: expiredAttendances } = await API.from("attendances")
    .select("id, course_id, courses(end_time)")
    .eq("date", today)
    .eq("is_present", true)
    .is("check_out_time", null);

  if (!expiredAttendances || expiredAttendances.length === 0) return;

  // Filter attendances where course end_time has passed
  const toCheckout = expiredAttendances.filter((attendance: any) => {
    const courseEndTime = attendance.courses?.end_time;
    return courseEndTime && courseEndTime < currentTime;
  });

  // Update all expired attendances
  if (toCheckout.length > 0) {
    const ids = toCheckout.map((a: any) => a.id);
    await API.from("attendances")
      .update({
        is_present: false,
        check_out_time: now.toISOString(),
      })
      .in("id", ids);
  }
};
