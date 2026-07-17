export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      help_request_activity: {
        Row: {
          action: string
          at: string
          id: string
          request_id: string
          who: string
        }
        Insert: {
          action: string
          at?: string
          id?: string
          request_id: string
          who: string
        }
        Update: {
          action?: string
          at?: string
          id?: string
          request_id?: string
          who?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_request_activity_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "help_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      help_request_helpers: {
        Row: {
          helper_id: string
          id: string
          offered_at: string
          request_id: string
        }
        Insert: {
          helper_id: string
          id?: string
          offered_at?: string
          request_id: string
        }
        Update: {
          helper_id?: string
          id?: string
          offered_at?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_request_helpers_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "helpers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_request_helpers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "help_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      help_requests: {
        Row: {
          category: string
          code: string
          description: string
          due_date: string | null
          id: string
          internal_notes: string | null
          location: string
          photo_url: string | null
          reported_at: string
          reporter_contact: string | null
          reporter_id: string | null
          reporter_name: string | null
          resolution_notes: string | null
          resolved_at: string | null
          skills_needed: string[]
          status: Database["public"]["Enums"]["issue_status"]
          tags: string[]
          title: string
          urgency: Database["public"]["Enums"]["issue_priority"]
        }
        Insert: {
          category?: string
          code: string
          description: string
          due_date?: string | null
          id?: string
          internal_notes?: string | null
          location?: string
          photo_url?: string | null
          reported_at?: string
          reporter_contact?: string | null
          reporter_id?: string | null
          reporter_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          skills_needed?: string[]
          status?: Database["public"]["Enums"]["issue_status"]
          tags?: string[]
          title: string
          urgency?: Database["public"]["Enums"]["issue_priority"]
        }
        Update: {
          category?: string
          code?: string
          description?: string
          due_date?: string | null
          id?: string
          internal_notes?: string | null
          location?: string
          photo_url?: string | null
          reported_at?: string
          reporter_contact?: string | null
          reporter_id?: string | null
          reporter_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          skills_needed?: string[]
          status?: Database["public"]["Enums"]["issue_status"]
          tags?: string[]
          title?: string
          urgency?: Database["public"]["Enums"]["issue_priority"]
        }
        Relationships: []
      }
      helpers: {
        Row: {
          badges: string[]
          code: string
          contributions_count: number
          created_at: string
          email: string
          id: string
          location: string
          name: string
          phone: string | null
          skills: string[]
          trust_score: number
        }
        Insert: {
          badges?: string[]
          code: string
          contributions_count?: number
          created_at?: string
          email: string
          id?: string
          location?: string
          name: string
          phone?: string | null
          skills?: string[]
          trust_score?: number
        }
        Update: {
          badges?: string[]
          code?: string
          contributions_count?: number
          created_at?: string
          email?: string
          id?: string
          location?: string
          name?: string
          phone?: string | null
          skills?: string[]
          trust_score?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          from_user_id: string
          id: string
          request_id: string
          sent_at: string
          to_user_id: string
        }
        Insert: {
          body: string
          from_user_id: string
          id?: string
          request_id: string
          sent_at?: string
          to_user_id: string
        }
        Update: {
          body?: string
          from_user_id?: string
          id?: string
          request_id?: string
          sent_at?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "help_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          read: boolean
          request_id: string | null
          text: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          read?: boolean
          request_id?: string | null
          text: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          read?: boolean
          request_id?: string | null
          text?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          badges: string[]
          contributions_count: number
          created_at: string
          email: string
          id: string
          interests: string[]
          location: string
          name: string
          org_name: string
          skills: string[]
          trust_score: number
        }
        Insert: {
          badges?: string[]
          contributions_count?: number
          created_at?: string
          email: string
          id: string
          interests?: string[]
          location?: string
          name: string
          org_name?: string
          skills?: string[]
          trust_score?: number
        }
        Update: {
          badges?: string[]
          contributions_count?: number
          created_at?: string
          email?: string
          id?: string
          interests?: string[]
          location?: string
          name?: string
          org_name?: string
          skills?: string[]
          trust_score?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "Admin" | "Technician" | "Student" | "Reporter"
      asset_status: "Active" | "Under Maintenance" | "Retired"
      issue_priority: "Low" | "Medium" | "High" | "Critical"
      issue_status: "Open" | "In Progress" | "Resolved" | "Overdue" | "Solved"
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
      app_role: ["Admin", "Technician", "Student", "Reporter"],
      asset_status: ["Active", "Under Maintenance", "Retired"],
      issue_priority: ["Low", "Medium", "High", "Critical"],
      issue_status: ["Open", "In Progress", "Resolved", "Overdue", "Solved"],
    },
  },
} as const
