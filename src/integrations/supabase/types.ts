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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      entries: {
        Row: {
          achievements: string[] | null
          ai_reflection: Json | null
          created_at: string
          date: string
          decisions: string[] | null
          id: string
          insights: string[] | null
          learnings: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievements?: string[] | null
          ai_reflection?: Json | null
          created_at?: string
          date?: string
          decisions?: string[] | null
          id?: string
          insights?: string[] | null
          learnings?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievements?: string[] | null
          ai_reflection?: Json | null
          created_at?: string
          date?: string
          decisions?: string[] | null
          id?: string
          insights?: string[] | null
          learnings?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          category: string
          created_at: string
          id: string
          status: string
          target_date: string | null
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          status?: string
          target_date?: string | null
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          status?: string
          target_date?: string | null
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_descriptions: {
        Row: {
          company: string
          content: string
          created_at: string
          end_date: string | null
          id: string
          responsibilities: string[] | null
          start_date: string
          title: string
          user_id: string
        }
        Insert: {
          company: string
          content: string
          created_at?: string
          end_date?: string | null
          id?: string
          responsibilities?: string[] | null
          start_date?: string
          title: string
          user_id: string
        }
        Update: {
          company?: string
          content?: string
          created_at?: string
          end_date?: string | null
          id?: string
          responsibilities?: string[] | null
          start_date?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      quarterly_checkins: {
        Row: {
          completed_at: string | null
          created_at: string
          flagged_responsibilities: Json | null
          focus_next_quarter: Json | null
          id: string
          quarter: number
          status: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          flagged_responsibilities?: Json | null
          focus_next_quarter?: Json | null
          id?: string
          quarter: number
          status?: string
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          flagged_responsibilities?: Json | null
          focus_next_quarter?: Json | null
          id?: string
          quarter?: number
          status?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      responsibility_matches: {
        Row: {
          created_at: string
          entry_id: string
          evidence_type: string
          id: string
          match_score: number
          matched_items: Json | null
          responsibility_index: number
          responsibility_text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          evidence_type?: string
          id?: string
          match_score?: number
          matched_items?: Json | null
          responsibility_index: number
          responsibility_text: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          evidence_type?: string
          id?: string
          match_score?: number
          matched_items?: Json | null
          responsibility_index?: number
          responsibility_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "responsibility_matches_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          ai_prompts_enabled: boolean
          created_at: string
          email_reminders_enabled: boolean
          id: string
          monthly_pulse_enabled: boolean
          quarterly_checkin_enabled: boolean
          recap_period: string
          reminder_day: string | null
          reminder_time: string | null
          shareable_recap: boolean
          updated_at: string
          user_id: string
          weekly_reminder: boolean
        }
        Insert: {
          ai_prompts_enabled?: boolean
          created_at?: string
          email_reminders_enabled?: boolean
          id?: string
          monthly_pulse_enabled?: boolean
          quarterly_checkin_enabled?: boolean
          recap_period?: string
          reminder_day?: string | null
          reminder_time?: string | null
          shareable_recap?: boolean
          updated_at?: string
          user_id: string
          weekly_reminder?: boolean
        }
        Update: {
          ai_prompts_enabled?: boolean
          created_at?: string
          email_reminders_enabled?: boolean
          id?: string
          monthly_pulse_enabled?: boolean
          quarterly_checkin_enabled?: boolean
          recap_period?: string
          reminder_day?: string | null
          reminder_time?: string | null
          shareable_recap?: boolean
          updated_at?: string
          user_id?: string
          weekly_reminder?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
