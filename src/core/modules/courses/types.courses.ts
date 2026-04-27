import { Tables } from "@core/network/supabase/database.types";

export type Course = Tables<"courses">;

export type CourseWithCampus = Course & {
  campuses: {
    id: number;
    name: string;
    location: string;
  };
};
