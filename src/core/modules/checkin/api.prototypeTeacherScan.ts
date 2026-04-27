import { API } from "@core/network/supabase/api";

export type PrototypeTeacherScanResult = {
  attendance_id: number;
  student: { id: string; first_name: string; last_name: string };
  course: { id: number; course_name: string; classroom: string };
  reused: boolean;
};

export async function prototypeTeacherScan(input: {
  qr: string;
  location: { lat: number; lon: number; accuracy_m?: number | null };
}) {
  const { data, error } = await API.functions.invoke("prototype-teacher-scan", {
    body: input,
  });
  if (error) throw error;
  return data as PrototypeTeacherScanResult;
}

