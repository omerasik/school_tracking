import { Campus } from "@core/modules/campuses/types.campuses";
import { Course } from "@core/modules/courses/types.courses";
import { Profile } from "@core/modules/profiles/types.profiles";
import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@core/network/supabase/database.types";

export type Attendance = Tables<"attendances">;

export type AttendanceWithProfile = Attendance & {
  profiles: Profile;
  campuses?: Campus | null;
  courses?: Course | null;
};

export type CreateAttendanceBody = TablesInsert<"attendances">;
export type UpdateAttendanceBody = TablesUpdate<"attendances">;
