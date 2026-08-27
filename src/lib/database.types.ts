/**
 * Auto-generated Supabase database types.
 * Regenerate after any schema change with the Supabase MCP server's
 * `generate_typescript_types` tool (or `supabase gen types typescript`
 * via the CLI) - do not hand-edit.
 */

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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      bubble_members: {
        Row: {
          bubble_id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          bubble_id: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          bubble_id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bubble_members_bubble_id_fkey"
            columns: ["bubble_id"]
            isOneToOne: false
            referencedRelation: "bubbles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bubble_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bubble_stars: {
        Row: {
          bubble_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          bubble_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          bubble_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bubble_stars_bubble_id_fkey"
            columns: ["bubble_id"]
            isOneToOne: false
            referencedRelation: "bubbles"
            referencedColumns: ["id"]
          },
        ]
      }
      bubbles: {
        Row: {
          activity: string
          created_at: string | null
          creator_id: string | null
          description: string | null
          duration_minutes: number | null
          emoji: string | null
          exact_location: string | null
          expires_at: string
          id: string
          lat: number | null
          lng: number | null
          max_members: number | null
          start_time: string | null
          status: string | null
          time_window: string
          zone: string
        }
        Insert: {
          activity: string
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          emoji?: string | null
          exact_location?: string | null
          expires_at: string
          id?: string
          lat?: number | null
          lng?: number | null
          max_members?: number | null
          start_time?: string | null
          status?: string | null
          time_window: string
          zone: string
        }
        Update: {
          activity?: string
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          emoji?: string | null
          exact_location?: string | null
          expires_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          max_members?: number | null
          start_time?: string | null
          status?: string | null
          time_window?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "bubbles_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_events: {
        Row: {
          category: string | null
          created_at: string
          date_time: string
          id: string
          location: string
          organizer: string | null
          source_url: string | null
          title: string
          zone: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          date_time: string
          id?: string
          location: string
          organizer?: string | null
          source_url?: string | null
          title: string
          zone?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          date_time?: string
          id?: string
          location?: string
          organizer?: string | null
          source_url?: string | null
          title?: string
          zone?: string | null
        }
        Relationships: []
      }
      connections: {
        Row: {
          created_at: string | null
          id: string | null
          receiver_id: string
          requester_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          receiver_id: string
          requester_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          receiver_id?: string
          requester_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connections_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meetup_photos: {
        Row: {
          bubble_id: string | null
          caption: string | null
          cloudinary_url: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          bubble_id?: string | null
          caption?: string | null
          cloudinary_url?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          bubble_id?: string | null
          caption?: string | null
          cloudinary_url?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetup_photos_bubble_id_fkey"
            columns: ["bubble_id"]
            isOneToOne: false
            referencedRelation: "bubbles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetup_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          bubble_id: string | null
          content: string
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          bubble_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          bubble_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_bubble_id_fkey"
            columns: ["bubble_id"]
            isOneToOne: false
            referencedRelation: "bubbles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          campus_verified: boolean | null
          created_at: string | null
          email: string
          id: string
          interests: string[] | null
          name: string | null
          personality_traits: string[] | null
          vibe: string | null
        }
        Insert: {
          campus_verified?: boolean | null
          created_at?: string | null
          email: string
          id: string
          interests?: string[] | null
          name?: string | null
          personality_traits?: string[] | null
          vibe?: string | null
        }
        Update: {
          campus_verified?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          interests?: string[] | null
          name?: string | null
          personality_traits?: string[] | null
          vibe?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_bubbles: { Args: never; Returns: undefined }
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
