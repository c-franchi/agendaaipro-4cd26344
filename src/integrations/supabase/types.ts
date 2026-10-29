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
      business_order_audit: {
        Row: {
          actor_id: string | null
          created_at: string
          details: Json
          event: string
          id: string
          order_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          details?: Json
          event: string
          id?: string
          order_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          details?: Json
          event?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_order_audit_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "business_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      business_order_events: {
        Row: {
          created_at: string
          event_id: string
          kind: string
          order_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          kind: string
          order_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          kind?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "business_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      business_orders: {
        Row: {
          approved_scope: string | null
          billing_event_created: number
          created_at: string
          currency: string
          email: string
          id: string
          installation_id: string | null
          livemode: boolean | null
          module_plan: string
          monthly_cents: number
          name: string
          paid_at: string | null
          payment_status: string
          plan_type: string
          ready_at: string | null
          request_key: string
          scope_note: string | null
          setup_cents: number
          setup_session_id: string | null
          stage: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          subscription_session_id: string | null
          subscription_status: string
          terms_accepted_at: string
          terms_version: string
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          approved_scope?: string | null
          billing_event_created?: number
          created_at?: string
          currency?: string
          email: string
          id?: string
          installation_id?: string | null
          livemode?: boolean | null
          module_plan: string
          monthly_cents: number
          name: string
          paid_at?: string | null
          payment_status?: string
          plan_type: string
          ready_at?: string | null
          request_key: string
          scope_note?: string | null
          setup_cents: number
          setup_session_id?: string | null
          stage?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          subscription_session_id?: string | null
          subscription_status?: string
          terms_accepted_at?: string
          terms_version?: string
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          approved_scope?: string | null
          billing_event_created?: number
          created_at?: string
          currency?: string
          email?: string
          id?: string
          installation_id?: string | null
          livemode?: boolean | null
          module_plan?: string
          monthly_cents?: number
          name?: string
          paid_at?: string | null
          payment_status?: string
          plan_type?: string
          ready_at?: string | null
          request_key?: string
          scope_note?: string | null
          setup_cents?: number
          setup_session_id?: string | null
          stage?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          subscription_session_id?: string | null
          subscription_status?: string
          terms_accepted_at?: string
          terms_version?: string
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      landing_content: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      leads: {
        Row: {
          business_type: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          source: string | null
        }
        Insert: {
          business_type?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          source?: string | null
        }
        Update: {
          business_type?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          source?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          app_access_enabled: boolean | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          plan_type: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          app_access_enabled?: boolean | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          plan_type?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          app_access_enabled?: boolean | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          plan_type?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voucher_uses: {
        Row: {
          discount_amount: number
          final_amount: number
          id: string
          original_amount: number
          plan_type: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          used_at: string
          user_email: string
          user_name: string | null
          voucher_id: string
        }
        Insert: {
          discount_amount: number
          final_amount: number
          id?: string
          original_amount: number
          plan_type?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          used_at?: string
          user_email: string
          user_name?: string | null
          voucher_id: string
        }
        Update: {
          discount_amount?: number
          final_amount?: number
          id?: string
          original_amount?: number
          plan_type?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          used_at?: string
          user_email?: string
          user_name?: string | null
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_uses_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          applies_to: string
          commerce_enabled: boolean
          discount_months: number
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          max_uses_per_user: number | null
          starts_at: string
          status: string
          updated_at: string
          validity_months: number | null
        }
        Insert: {
          commerce_enabled?: boolean
          discount_months?: number
          applies_to?: string
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          max_uses_per_user?: number | null
          starts_at?: string
          status?: string
          updated_at?: string
          validity_months?: number | null
        }
        Update: {
          commerce_enabled?: boolean
          discount_months?: number
          applies_to?: string
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          max_uses_per_user?: number | null
          starts_at?: string
          status?: string
          updated_at?: string
          validity_months?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      commerce_record_payment: {
        Args: {
          p_amount: number
          p_currency: string
          p_customer: string
          p_event: string
          p_intent: string
          p_kind: string
          p_live: boolean
          p_order: string
          p_session: string
          p_subscription: string
        }
        Returns: boolean
      }
      commerce_refund: {
        Args: {
          p_event: string
          p_full: boolean
          p_intent: string
          p_order?: string
        }
        Returns: undefined
      }
      commerce_transition: {
        Args: {
          p_action: string
          p_actor: string
          p_installation?: string
          p_note: string
          p_order: string
          p_url?: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_voucher_uses: {
        Args: { voucher_code: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
