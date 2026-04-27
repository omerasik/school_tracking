export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      attendances: {
        Row: {
          campus_id: number;
          check_in_time: string;
          check_out_time: string | null;
          classroom: string;
          course_id: number | null;
          course_name: string;
          date: string;
          hash: string;
          id: number;
          is_present: boolean;
          latitude: number | null;
          lesson_type: string;
          location_accuracy: number | null;
          longitude: number | null;
          qr_code_expires_at: string;
          user_id: string;
        };
        Insert: {
          campus_id: number;
          check_in_time?: string;
          check_out_time?: string | null;
          classroom?: string;
          course_id?: number | null;
          course_name?: string;
          date: string;
          hash: string;
          id?: number;
          is_present?: boolean;
          latitude?: number | null;
          lesson_type?: string;
          location_accuracy?: number | null;
          longitude?: number | null;
          qr_code_expires_at: string;
          user_id: string;
        };
        Update: {
          campus_id?: number;
          check_in_time?: string;
          check_out_time?: string | null;
          classroom?: string;
          course_id?: number | null;
          course_name?: string;
          date?: string;
          hash?: string;
          id?: number;
          is_present?: boolean;
          latitude?: number | null;
          lesson_type?: string;
          location_accuracy?: number | null;
          longitude?: number | null;
          qr_code_expires_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendances_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendances_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendances_hash_fkey";
            columns: ["hash"];
            isOneToOne: false;
            referencedRelation: "qr_codes";
            referencedColumns: ["hash"];
          },
          {
            foreignKeyName: "attendances_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      campuses: {
        Row: {
          id: number;
          latitude: number | null;
          location: string;
          longitude: number | null;
          name: string;
          timestamp: string | null;
        };
        Insert: {
          id?: number;
          latitude?: number | null;
          location: string;
          longitude?: number | null;
          name: string;
          timestamp?: string | null;
        };
        Update: {
          id?: number;
          latitude?: number | null;
          location?: string;
          longitude?: number | null;
          name?: string;
          timestamp?: string | null;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          campus_id: number | null;
          classroom: string;
          course_name: string;
          created_at: string | null;
          date: string;
          end_time: string;
          id: number;
          lesson_type: string | null;
          start_time: string;
          teacher_names: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          campus_id?: number | null;
          classroom: string;
          course_name: string;
          created_at?: string | null;
          date: string;
          end_time: string;
          id?: number;
          lesson_type?: string | null;
          start_time: string;
          teacher_names?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          campus_id?: number | null;
          classroom?: string;
          course_name?: string;
          created_at?: string | null;
          date?: string;
          end_time?: string;
          id?: number;
          lesson_type?: string | null;
          start_time?: string;
          teacher_names?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "courses_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          first_name: string;
          id: string;
          last_name: string;
          role: Database["public"]["Enums"]["role"];
        };
        Insert: {
          created_at?: string;
          first_name: string;
          id: string;
          last_name: string;
          role?: Database["public"]["Enums"]["role"];
        };
        Update: {
          created_at?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          role?: Database["public"]["Enums"]["role"];
        };
        Relationships: [];
      };
      qr_codes: {
        Row: {
          created_at: string;
          expires_at: string;
          hash: string;
          id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          hash: string;
          id?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          hash?: string;
          id?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          id: string;
          sound_enabled: boolean;
          updated_at: string;
          vibration_enabled: boolean;
        };
        Insert: {
          id: string;
          sound_enabled?: boolean;
          updated_at?: string;
          vibration_enabled?: boolean;
        };
        Update: {
          id?: string;
          sound_enabled?: boolean;
          updated_at?: string;
          vibration_enabled?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "settings_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      role: "docent" | "student";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      role: ["docent", "student"],
    },
  },
} as const;
