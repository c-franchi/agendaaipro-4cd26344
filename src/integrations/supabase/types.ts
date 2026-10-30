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
          business_name: string | null
          business_type: string | null
          contract_flow: string
          created_at: string
          currency: string
          email: string
          id: string
          installation_id: string | null
          livemode: boolean | null
          module_plan: string
          monthly_cents: number
          monthly_due_cents: number | null
          name: string
          paid_at: string | null
          payment_status: string
          phone: string | null
          plan_type: string
          promotion_snapshot: Json | null
          ready_at: string | null
          request_key: string
          request_message: string | null
          requested_monthly_code: string | null
          requested_setup_code: string | null
          scope_note: string | null
          setup_cents: number
          setup_due_cents: number | null
          setup_session_id: string | null
          setup_waived: boolean
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
          business_name?: string | null
          business_type?: string | null
          contract_flow?: string
          created_at?: string
          currency?: string
          email: string
          id?: string
          installation_id?: string | null
          livemode?: boolean | null
          module_plan: string
          monthly_cents: number
          monthly_due_cents?: number | null
          name: string
          paid_at?: string | null
          payment_status?: string
          phone?: string | null
          plan_type: string
          promotion_snapshot?: Json | null
          ready_at?: string | null
          request_key: string
          request_message?: string | null
          requested_monthly_code?: string | null
          requested_setup_code?: string | null
          scope_note?: string | null
          setup_cents: number
          setup_due_cents?: number | null
          setup_session_id?: string | null
          setup_waived?: boolean
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
          business_name?: string | null
          business_type?: string | null
          contract_flow?: string
          created_at?: string
          currency?: string
          email?: string
          id?: string
          installation_id?: string | null
          livemode?: boolean | null
          module_plan?: string
          monthly_cents?: number
          monthly_due_cents?: number | null
          name?: string
          paid_at?: string | null
          payment_status?: string
          phone?: string | null
          plan_type?: string
          promotion_snapshot?: Json | null
          ready_at?: string | null
          request_key?: string
          request_message?: string | null
          requested_monthly_code?: string | null
          requested_setup_code?: string | null
          scope_note?: string | null
          setup_cents?: number
          setup_due_cents?: number | null
          setup_session_id?: string | null
          setup_waived?: boolean
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
      commerce_voucher_reservations: {
        Row: {
          base_cents: number
          code: string
          coupon_id: string | null
          created_at: string
          discount_cents: number
          due_cents: number
          id: string
          kind: string
          months: number
          order_id: string
          session_id: string | null
          state: string
          user_id: string
          voucher_id: string
        }
        Insert: {
          base_cents: number
          code: string
          coupon_id?: string | null
          created_at?: string
          discount_cents: number
          due_cents: number
          id?: string
          kind: string
          months: number
          order_id: string
          session_id?: string | null
          state?: string
          user_id: string
          voucher_id: string
        }
        Update: {
          base_cents?: number
          code?: string
          coupon_id?: string | null
          created_at?: string
          discount_cents?: number
          due_cents?: number
          id?: string
          kind?: string
          months?: number
          order_id?: string
          session_id?: string | null
          state?: string
          user_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commerce_voucher_reservations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "business_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commerce_voucher_reservations_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_promotions: {
        Row: {
          active: boolean
          allow_voucher: boolean
          ends_at: string | null
          monthly_cents: number
          plan_type: string
          setup_cents: number
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          allow_voucher?: boolean
          ends_at?: string | null
          monthly_cents: number
          plan_type: string
          setup_cents: number
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          allow_voucher?: boolean
          ends_at?: string | null
          monthly_cents?: number
          plan_type?: string
          setup_cents?: number
          starts_at?: string
          title?: string
          updated_at?: string
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
      order_assets: {
        Row: {
          active: boolean
          created_at: string
          filename: string
          id: string
          kind: string
          order_id: string
          path: string
          review_note: string | null
          status: string
          uploaded_by: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          filename: string
          id?: string
          kind: string
          order_id: string
          path: string
          review_note?: string | null
          status?: string
          uploaded_by: string
        }
        Update: {
          active?: boolean
          created_at?: string
          filename?: string
          id?: string
          kind?: string
          order_id?: string
          path?: string
          review_note?: string | null
          status?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_assets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "business_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_messages: {
        Row: {
          author_id: string
          author_role: string
          body: string
          created_at: string
          id: string
          order_id: string
        }
        Insert: {
          author_id: string
          author_role: string
          body: string
          created_at?: string
          id: string
          order_id: string
        }
        Update: {
          author_id?: string
          author_role?: string
          body?: string
          created_at?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "business_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notifications: {
        Row: {
          attempts: number
          audience: string
          body: string
          created_at: string
          error: string | null
          event_key: string
          id: string
          last_attempt: string | null
          order_id: string
          provider_id: string | null
          status: string
          subject: string
        }
        Insert: {
          attempts?: number
          audience: string
          body: string
          created_at?: string
          error?: string | null
          event_key: string
          id?: string
          last_attempt?: string | null
          order_id: string
          provider_id?: string | null
          status?: string
          subject: string
        }
        Update: {
          attempts?: number
          audience?: string
          body?: string
          created_at?: string
          error?: string | null
          event_key?: string
          id?: string
          last_attempt?: string | null
          order_id?: string
          provider_id?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "business_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_timeline: {
        Row: {
          created_at: string
          event: string
          id: string
          note: string
          order_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          note: string
          order_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          note?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_timeline_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "business_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_workspaces: {
        Row: {
          approved_at: string | null
          brief: Json
          installation_id: string | null
          modules_confirmed: boolean
          order_id: string
          phase: string
          preview_url: string | null
          production_started_at: string | null
          revision_count: number
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          brief?: Json
          installation_id?: string | null
          modules_confirmed?: boolean
          order_id: string
          phase?: string
          preview_url?: string | null
          production_started_at?: string | null
          revision_count?: number
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          brief?: Json
          installation_id?: string | null
          modules_confirmed?: boolean
          order_id?: string
          phase?: string
          preview_url?: string | null
          production_started_at?: string | null
          revision_count?: number
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_workspaces_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "business_orders"
            referencedColumns: ["id"]
          },
        ]
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
          code: string
          commerce_enabled: boolean
          created_at: string
          created_by: string | null
          current_uses: number
          discount_months: number
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
          applies_to?: string
          code: string
          commerce_enabled?: boolean
          created_at?: string
          created_by?: string | null
          current_uses?: number
          discount_months?: number
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
          applies_to?: string
          code?: string
          commerce_enabled?: boolean
          created_at?: string
          created_by?: string | null
          current_uses?: number
          discount_months?: number
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
      commerce_claim_notifications: {
        Args: { p_order: string }
        Returns: {
          attempts: number
          audience: string
          body: string
          created_at: string
          error: string | null
          event_key: string
          id: string
          last_attempt: string | null
          order_id: string
          provider_id: string | null
          status: string
          subject: string
        }[]
        SetofOptions: {
          from: "*"
          to: "order_notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      commerce_offer_quote: {
        Args: { p_code?: string; p_plan: string }
        Returns: Json
      }
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
      commerce_release_voucher: {
        Args: { p_session: string }
        Returns: undefined
      }
      commerce_request_offer: {
        Args: {
          p_code: string
          p_contact: Json
          p_fingerprint: string
          p_key: string
          p_plan: string
          p_terms: string
        }
        Returns: {
          approved_scope: string | null
          billing_event_created: number
          business_name: string | null
          business_type: string | null
          contract_flow: string
          created_at: string
          currency: string
          email: string
          id: string
          installation_id: string | null
          livemode: boolean | null
          module_plan: string
          monthly_cents: number
          monthly_due_cents: number | null
          name: string
          paid_at: string | null
          payment_status: string
          phone: string | null
          plan_type: string
          promotion_snapshot: Json | null
          ready_at: string | null
          request_key: string
          request_message: string | null
          requested_monthly_code: string | null
          requested_setup_code: string | null
          scope_note: string | null
          setup_cents: number
          setup_due_cents: number | null
          setup_session_id: string | null
          setup_waived: boolean
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
        SetofOptions: {
          from: "*"
          to: "business_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      commerce_reserve_voucher: {
        Args: {
          p_code: string
          p_kind: string
          p_order: string
          p_preview?: boolean
          p_user: string
        }
        Returns: {
          base_cents: number
          code: string
          coupon_id: string | null
          created_at: string
          discount_cents: number
          due_cents: number
          id: string
          kind: string
          months: number
          order_id: string
          session_id: string | null
          state: string
          user_id: string
          voucher_id: string
        }
        SetofOptions: {
          from: "*"
          to: "commerce_voucher_reservations"
          isOneToOne: true
          isSetofReturn: false
        }
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
      commerce_workspace: {
        Args: { p_action: string; p_data?: Json; p_order: string }
        Returns: Json
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
