export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          comment: string | null
          created_at: string
          id: string
          new_status: string | null
          previous_status: string | null
          target_id: string
          target_table: string
        }
        Insert: {
          action: string
          admin_id: string
          comment?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          previous_status?: string | null
          target_id: string
          target_table: string
        }
        Update: {
          action?: string
          admin_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          previous_status?: string | null
          target_id?: string
          target_table?: string
        }
        Relationships: []
      }
      cardio_logs: {
        Row: {
          admin_comment: string | null
          cardio_type: Database["public"]["Enums"]["cardio_type"]
          created_at: string
          date: string
          distance: number
          distance_unit: string
          id: string
          notes: string | null
          user_id: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_comment?: string | null
          cardio_type: Database["public"]["Enums"]["cardio_type"]
          created_at?: string
          date: string
          distance: number
          distance_unit?: string
          id?: string
          notes?: string | null
          user_id: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_comment?: string | null
          cardio_type?: Database["public"]["Enums"]["cardio_type"]
          created_at?: string
          date?: string
          distance?: number
          distance_unit?: string
          id?: string
          notes?: string | null
          user_id?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      digest_queue: {
        Row: {
          admin_comment: string | null
          created_at: string
          id: string
          log_date: string
          log_details: string
          log_id: string
          log_type: string
          new_status: string
          previous_status: string
          processed: boolean
          processed_at: string | null
          user_id: string
        }
        Insert: {
          admin_comment?: string | null
          created_at?: string
          id?: string
          log_date: string
          log_details: string
          log_id: string
          log_type: string
          new_status: string
          previous_status: string
          processed?: boolean
          processed_at?: string | null
          user_id: string
        }
        Update: {
          admin_comment?: string | null
          created_at?: string
          id?: string
          log_date?: string
          log_details?: string
          log_id?: string
          log_type?: string
          new_status?: string
          previous_status?: string
          processed?: boolean
          processed_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          log_id: string
          log_type: string
          notification_type: string
          recipient_email: string
          recipient_user_id: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          log_id: string
          log_type: string
          notification_type: string
          recipient_email: string
          recipient_user_id: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          log_id?: string
          log_type?: string
          notification_type?: string
          recipient_email?: string
          recipient_user_id?: string
          status?: string
        }
        Relationships: []
      }
      hiit_logs: {
        Row: {
          admin_comment: string | null
          created_at: string
          date: string
          description: string | null
          duration: number
          id: string
          user_id: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_comment?: string | null
          created_at?: string
          date: string
          description?: string | null
          duration: number
          id?: string
          user_id: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_comment?: string | null
          created_at?: string
          date?: string
          description?: string | null
          duration?: number
          id?: string
          user_id?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      mission_phases: {
        Row: {
          created_at: string
          end_day: number
          id: string
          mission_id: string
          phase_number: number
          progression_rules: Json | null
          start_day: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_day: number
          id?: string
          mission_id: string
          phase_number: number
          progression_rules?: Json | null
          start_day: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_day?: number
          id?: string
          mission_id?: string
          phase_number?: number
          progression_rules?: Json | null
          start_day?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_phases_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_schedule: {
        Row: {
          created_at: string
          day_number: number
          id: string
          mission_id: string
          phase_number: number | null
          scaling_overrides: Json | null
          updated_at: string
          workout_id: string
        }
        Insert: {
          created_at?: string
          day_number: number
          id?: string
          mission_id: string
          phase_number?: number | null
          scaling_overrides?: Json | null
          updated_at?: string
          workout_id: string
        }
        Update: {
          created_at?: string
          day_number?: number
          id?: string
          mission_id?: string
          phase_number?: number | null
          scaling_overrides?: Json | null
          updated_at?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_schedule_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_schedule_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          cover_image_url: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["mission_difficulty"]
          duration_days: number
          duration_weeks: number | null
          focus: Database["public"]["Enums"]["mission_focus"]
          id: string
          is_published: boolean
          short_description: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          difficulty: Database["public"]["Enums"]["mission_difficulty"]
          duration_days: number
          duration_weeks?: number | null
          focus: Database["public"]["Enums"]["mission_focus"]
          id?: string
          is_published?: boolean
          short_description: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["mission_difficulty"]
          duration_days?: number
          duration_weeks?: number | null
          focus?: Database["public"]["Enums"]["mission_focus"]
          id?: string
          is_published?: boolean
          short_description?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          admin_comment: string | null
          created_at: string
          id: string
          is_read: boolean
          log_date: string | null
          log_id: string | null
          log_type: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          admin_comment?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          log_date?: string | null
          log_id?: string | null
          log_type?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          admin_comment?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          log_date?: string | null
          log_id?: string | null
          log_type?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email_notifications: boolean
          full_name: string | null
          id: string
          in_app_notifications: boolean
          notification_mode: string
          notify_on_flagged: boolean
          notify_on_verified: boolean
          unit: string | null
          unit_category: Database["public"]["Enums"]["unit_category"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          full_name?: string | null
          id?: string
          in_app_notifications?: boolean
          notification_mode?: string
          notify_on_flagged?: boolean
          notify_on_verified?: boolean
          unit?: string | null
          unit_category?: Database["public"]["Enums"]["unit_category"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          full_name?: string | null
          id?: string
          in_app_notifications?: boolean
          notification_mode?: string
          notify_on_flagged?: boolean
          notify_on_verified?: boolean
          unit?: string | null
          unit_category?: Database["public"]["Enums"]["unit_category"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      strength_logs: {
        Row: {
          admin_comment: string | null
          created_at: string
          date: string
          exercise_name: string
          id: string
          notes: string | null
          reps_per_set: number
          sets: number
          total_weight: number
          user_id: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
          weight_per_rep: number
        }
        Insert: {
          admin_comment?: string | null
          created_at?: string
          date: string
          exercise_name: string
          id?: string
          notes?: string | null
          reps_per_set: number
          sets: number
          total_weight: number
          user_id: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          weight_per_rep: number
        }
        Update: {
          admin_comment?: string | null
          created_at?: string
          date?: string
          exercise_name?: string
          id?: string
          notes?: string | null
          reps_per_set?: number
          sets?: number
          total_weight?: number
          user_id?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          weight_per_rep?: number
        }
        Relationships: []
      }
      tmarm_logs: {
        Row: {
          admin_comment: string | null
          created_at: string
          date: string
          description: string | null
          duration: number
          id: string
          user_id: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_comment?: string | null
          created_at?: string
          date: string
          description?: string | null
          duration: number
          id?: string
          user_id: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_comment?: string | null
          created_at?: string
          date?: string
          description?: string | null
          duration?: number
          id?: string
          user_id?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      user_mission_day_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          day_number: number
          id: string
          mission_id: string
          notes: string | null
          status: Database["public"]["Enums"]["day_progress_status"]
          updated_at: string
          user_id: string
          workout_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          day_number: number
          id?: string
          mission_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["day_progress_status"]
          updated_at?: string
          user_id: string
          workout_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          day_number?: number
          id?: string
          mission_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["day_progress_status"]
          updated_at?: string
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_mission_day_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_mission_day_progress_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_missions: {
        Row: {
          completed_at: string | null
          completion_percent: number
          current_day_number: number
          id: string
          joined_at: string
          last_activity_at: string | null
          mission_id: string
          status: Database["public"]["Enums"]["mission_status"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completion_percent?: number
          current_day_number?: number
          id?: string
          joined_at?: string
          last_activity_at?: string | null
          mission_id: string
          status?: Database["public"]["Enums"]["mission_status"]
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completion_percent?: number
          current_day_number?: number
          id?: string
          joined_at?: string
          last_activity_at?: string | null
          mission_id?: string
          status?: Database["public"]["Enums"]["mission_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_workout_step_progress: {
        Row: {
          completed_at: string | null
          day_number: number
          id: string
          is_complete: boolean
          mission_id: string
          user_id: string
          value: Json | null
          workout_id: string
          workout_step_id: string
        }
        Insert: {
          completed_at?: string | null
          day_number: number
          id?: string
          is_complete?: boolean
          mission_id: string
          user_id: string
          value?: Json | null
          workout_id: string
          workout_step_id: string
        }
        Update: {
          completed_at?: string | null
          day_number?: number
          id?: string
          is_complete?: boolean
          mission_id?: string
          user_id?: string
          value?: Json | null
          workout_id?: string
          workout_step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_workout_step_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_workout_step_progress_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_workout_step_progress_workout_step_id_fkey"
            columns: ["workout_step_id"]
            isOneToOne: false
            referencedRelation: "workout_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_steps: {
        Row: {
          distance_meters: number | null
          id: string
          load_lbs: number | null
          name: string
          notes: string | null
          order_index: number
          reps: number | null
          rest_seconds: number | null
          sets: number | null
          step_type: Database["public"]["Enums"]["step_type"]
          work_seconds: number | null
          workout_id: string
        }
        Insert: {
          distance_meters?: number | null
          id?: string
          load_lbs?: number | null
          name: string
          notes?: string | null
          order_index?: number
          reps?: number | null
          rest_seconds?: number | null
          sets?: number | null
          step_type?: Database["public"]["Enums"]["step_type"]
          work_seconds?: number | null
          workout_id: string
        }
        Update: {
          distance_meters?: number | null
          id?: string
          load_lbs?: number | null
          name?: string
          notes?: string | null
          order_index?: number
          reps?: number | null
          rest_seconds?: number | null
          sets?: number | null
          step_type?: Database["public"]["Enums"]["step_type"]
          work_seconds?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_steps_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          description: string | null
          equipment: Json | null
          estimated_minutes: number
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          equipment?: Json | null
          estimated_minutes?: number
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          equipment?: Json | null
          estimated_minutes?: number
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_mission_participant_count: {
        Args: { p_mission_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "soldier"
      cardio_type: "run_walk_ruck" | "bike" | "swim" | "row_elliptical"
      day_progress_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "skipped"
      mission_difficulty: "beginner" | "intermediate" | "advanced"
      mission_focus:
        | "strength"
        | "cardio"
        | "endurance"
        | "core"
        | "recovery"
        | "extreme"
      mission_status: "active" | "completed" | "abandoned"
      step_type: "exercise" | "interval" | "rest"
      unit_category:
        | "veterans"
        | "government"
        | "military_family"
        | "civilian"
        | "other"
      verification_status: "pending" | "verified" | "flagged"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "soldier"],
      cardio_type: ["run_walk_ruck", "bike", "swim", "row_elliptical"],
      day_progress_status: [
        "not_started",
        "in_progress",
        "completed",
        "skipped",
      ],
      mission_difficulty: ["beginner", "intermediate", "advanced"],
      mission_focus: [
        "strength",
        "cardio",
        "endurance",
        "core",
        "recovery",
        "extreme",
      ],
      mission_status: ["active", "completed", "abandoned"],
      step_type: ["exercise", "interval", "rest"],
      unit_category: [
        "veterans",
        "government",
        "military_family",
        "civilian",
        "other",
      ],
      verification_status: ["pending", "verified", "flagged"],
    },
  },
} as const
