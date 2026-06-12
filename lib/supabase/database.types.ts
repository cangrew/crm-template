// Hand-maintained to mirror supabase/migrations. Regenerate against a running
// local stack with `pnpm db:types` whenever the schema changes.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      agencies: {
        Row: {
          commission_cut_bps: number;
          created_at: string;
          id: string;
          name: string;
          notes: string | null;
          override_cut_bps: number;
          owner_profile_id: string | null;
          status: Database["public"]["Enums"]["agency_status"];
          updated_at: string;
        };
        Insert: {
          commission_cut_bps?: number;
          created_at?: string;
          id?: string;
          name: string;
          notes?: string | null;
          override_cut_bps?: number;
          owner_profile_id?: string | null;
          status?: Database["public"]["Enums"]["agency_status"];
          updated_at?: string;
        };
        Update: {
          commission_cut_bps?: number;
          created_at?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          override_cut_bps?: number;
          owner_profile_id?: string | null;
          status?: Database["public"]["Enums"]["agency_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agencies_owner_profile_id_fkey";
            columns: ["owner_profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      agents: {
        Row: {
          agency_id: string | null;
          commission_split_bps: number;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          npn: string | null;
          profile_id: string | null;
          status: Database["public"]["Enums"]["agent_status"];
          updated_at: string;
        };
        Insert: {
          agency_id?: string | null;
          commission_split_bps?: number;
          created_at?: string;
          email?: string | null;
          full_name: string;
          id?: string;
          npn?: string | null;
          profile_id?: string | null;
          status?: Database["public"]["Enums"]["agent_status"];
          updated_at?: string;
        };
        Update: {
          agency_id?: string | null;
          commission_split_bps?: number;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          npn?: string | null;
          profile_id?: string | null;
          status?: Database["public"]["Enums"]["agent_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agents_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agents_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      carrier_csv_mappings: {
        Row: {
          carrier_id: string;
          created_at: string;
          header_signature: string | null;
          id: string;
          mapping: Json;
          name: string;
          source_config: Json;
          updated_at: string;
        };
        Insert: {
          carrier_id: string;
          created_at?: string;
          header_signature?: string | null;
          id?: string;
          mapping: Json;
          name: string;
          source_config?: Json;
          updated_at?: string;
        };
        Update: {
          carrier_id?: string;
          created_at?: string;
          header_signature?: string | null;
          id?: string;
          mapping?: Json;
          name?: string;
          source_config?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "carrier_csv_mappings_carrier_id_fkey";
            columns: ["carrier_id"];
            isOneToOne: false;
            referencedRelation: "carriers";
            referencedColumns: ["id"];
          },
        ];
      };
      carriers: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          notes: string | null;
          status: Database["public"]["Enums"]["carrier_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          notes?: string | null;
          status?: Database["public"]["Enums"]["carrier_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          status?: Database["public"]["Enums"]["carrier_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      commission_statements: {
        Row: {
          carrier_id: string;
          created_at: string;
          id: string;
          line_count: number;
          period_month: string;
          status: Database["public"]["Enums"]["statement_status"];
          storage_path: string | null;
          total_amount_cents: number;
          updated_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          carrier_id: string;
          created_at?: string;
          id?: string;
          line_count?: number;
          period_month: string;
          status?: Database["public"]["Enums"]["statement_status"];
          storage_path?: string | null;
          total_amount_cents?: number;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          carrier_id?: string;
          created_at?: string;
          id?: string;
          line_count?: number;
          period_month?: string;
          status?: Database["public"]["Enums"]["statement_status"];
          storage_path?: string | null;
          total_amount_cents?: number;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "commission_statements_carrier_id_fkey";
            columns: ["carrier_id"];
            isOneToOne: false;
            referencedRelation: "carriers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commission_statements_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          address: string | null;
          agent_id: string | null;
          created_at: string;
          created_by: string | null;
          dob: string | null;
          email: string | null;
          first_name: string;
          id: string;
          last_name: string;
          notes: string | null;
          phone: string | null;
          status: Database["public"]["Enums"]["client_status"];
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          agent_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          dob?: string | null;
          email?: string | null;
          first_name: string;
          id?: string;
          last_name: string;
          notes?: string | null;
          phone?: string | null;
          status?: Database["public"]["Enums"]["client_status"];
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          agent_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          dob?: string | null;
          email?: string | null;
          first_name?: string;
          id?: string;
          last_name?: string;
          notes?: string | null;
          phone?: string | null;
          status?: Database["public"]["Enums"]["client_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clients_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          client_id: string | null;
          created_at: string;
          id: string;
          kind: string;
          storage_path: string;
          uploaded_by: string | null;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string;
          id?: string;
          kind: string;
          storage_path: string;
          uploaded_by?: string | null;
        };
        Update: {
          client_id?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          storage_path?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ledger_entries: {
        Row: {
          agency_id: string | null;
          agent_id: string | null;
          amount_cents: number;
          applied_bps: number | null;
          created_at: string;
          entry_kind: Database["public"]["Enums"]["ledger_entry_kind"];
          id: string;
          payee_type: Database["public"]["Enums"]["payee_type"];
          payout_statement_id: string | null;
          period_month: string;
          policy_id: string;
          statement_line_id: string;
        };
        Insert: {
          agency_id?: string | null;
          agent_id?: string | null;
          amount_cents: number;
          applied_bps?: number | null;
          created_at?: string;
          entry_kind: Database["public"]["Enums"]["ledger_entry_kind"];
          id?: string;
          payee_type: Database["public"]["Enums"]["payee_type"];
          payout_statement_id?: string | null;
          period_month: string;
          policy_id: string;
          statement_line_id: string;
        };
        Update: {
          agency_id?: string | null;
          agent_id?: string | null;
          amount_cents?: number;
          applied_bps?: number | null;
          created_at?: string;
          entry_kind?: Database["public"]["Enums"]["ledger_entry_kind"];
          id?: string;
          payee_type?: Database["public"]["Enums"]["payee_type"];
          payout_statement_id?: string | null;
          period_month?: string;
          policy_id?: string;
          statement_line_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ledger_entries_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ledger_entries_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ledger_entries_payout_statement_id_fkey";
            columns: ["payout_statement_id"];
            isOneToOne: false;
            referencedRelation: "payout_statements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ledger_entries_policy_id_fkey";
            columns: ["policy_id"];
            isOneToOne: false;
            referencedRelation: "policies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ledger_entries_statement_line_id_fkey";
            columns: ["statement_line_id"];
            isOneToOne: false;
            referencedRelation: "statement_lines";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_preferences: {
        Row: {
          muted: boolean;
          type: Database["public"]["Enums"]["notification_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          muted?: boolean;
          type: Database["public"]["Enums"]["notification_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          muted?: boolean;
          type?: Database["public"]["Enums"]["notification_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          priority: Database["public"]["Enums"]["notification_priority"];
          read_at: string | null;
          title: string;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Insert: {
          body?: string;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          priority?: Database["public"]["Enums"]["notification_priority"];
          read_at?: string | null;
          title: string;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          priority?: Database["public"]["Enums"]["notification_priority"];
          read_at?: string | null;
          title?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payout_statements: {
        Row: {
          agency_id: string | null;
          agent_id: string | null;
          created_at: string;
          id: string;
          payee_type: Database["public"]["Enums"]["payee_type"];
          period_month: string;
          status: Database["public"]["Enums"]["payout_status"];
          total_cents: number;
          updated_at: string;
        };
        Insert: {
          agency_id?: string | null;
          agent_id?: string | null;
          created_at?: string;
          id?: string;
          payee_type: Database["public"]["Enums"]["payee_type"];
          period_month: string;
          status?: Database["public"]["Enums"]["payout_status"];
          total_cents?: number;
          updated_at?: string;
        };
        Update: {
          agency_id?: string | null;
          agent_id?: string | null;
          created_at?: string;
          id?: string;
          payee_type?: Database["public"]["Enums"]["payee_type"];
          period_month?: string;
          status?: Database["public"]["Enums"]["payout_status"];
          total_cents?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payout_statements_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payout_statements_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
        ];
      };
      policies: {
        Row: {
          agent_id: string;
          carrier_id: string;
          carrier_member_id: string | null;
          client_id: string;
          created_at: string;
          created_by: string | null;
          effective_date: string | null;
          effectuated_at: string | null;
          id: string;
          member_count: number;
          monthly_premium_cents: number | null;
          notes: string | null;
          original_effective_date: string | null;
          plan_name: string | null;
          policy_number: string | null;
          status: Database["public"]["Enums"]["policy_status"];
          termination_date: string | null;
          updated_at: string;
        };
        Insert: {
          agent_id: string;
          carrier_id: string;
          carrier_member_id?: string | null;
          client_id: string;
          created_at?: string;
          created_by?: string | null;
          effective_date?: string | null;
          effectuated_at?: string | null;
          id?: string;
          member_count?: number;
          monthly_premium_cents?: number | null;
          notes?: string | null;
          original_effective_date?: string | null;
          plan_name?: string | null;
          policy_number?: string | null;
          status?: Database["public"]["Enums"]["policy_status"];
          termination_date?: string | null;
          updated_at?: string;
        };
        Update: {
          agent_id?: string;
          carrier_id?: string;
          carrier_member_id?: string | null;
          client_id?: string;
          created_at?: string;
          created_by?: string | null;
          effective_date?: string | null;
          effectuated_at?: string | null;
          id?: string;
          member_count?: number;
          monthly_premium_cents?: number | null;
          notes?: string | null;
          original_effective_date?: string | null;
          plan_name?: string | null;
          policy_number?: string | null;
          status?: Database["public"]["Enums"]["policy_status"];
          termination_date?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "policies_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "policies_carrier_id_fkey";
            columns: ["carrier_id"];
            isOneToOne: false;
            referencedRelation: "carriers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "policies_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "policies_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          is_active: boolean;
          role: Database["public"]["Enums"]["app_role"] | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string;
          id: string;
          is_active?: boolean;
          role?: Database["public"]["Enums"]["app_role"] | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          role?: Database["public"]["Enums"]["app_role"] | null;
        };
        Relationships: [];
      };
      rate_schedules: {
        Row: {
          business_type: Database["public"]["Enums"]["business_type"];
          carrier_id: string;
          created_at: string;
          effective_from: string;
          effective_to: string | null;
          id: string;
          pmpm_cents: number | null;
          percent_bps: number | null;
          rate_type: Database["public"]["Enums"]["rate_type"];
          state: string | null;
          updated_at: string;
        };
        Insert: {
          business_type: Database["public"]["Enums"]["business_type"];
          carrier_id: string;
          created_at?: string;
          effective_from: string;
          effective_to?: string | null;
          id?: string;
          pmpm_cents?: number | null;
          percent_bps?: number | null;
          rate_type: Database["public"]["Enums"]["rate_type"];
          state?: string | null;
          updated_at?: string;
        };
        Update: {
          business_type?: Database["public"]["Enums"]["business_type"];
          carrier_id?: string;
          created_at?: string;
          effective_from?: string;
          effective_to?: string | null;
          id?: string;
          pmpm_cents?: number | null;
          percent_bps?: number | null;
          rate_type?: Database["public"]["Enums"]["rate_type"];
          state?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rate_schedules_carrier_id_fkey";
            columns: ["carrier_id"];
            isOneToOne: false;
            referencedRelation: "carriers";
            referencedColumns: ["id"];
          },
        ];
      };
      statement_lines: {
        Row: {
          amount_cents: number;
          business_type: Database["public"]["Enums"]["business_type"] | null;
          carrier_member_id: string | null;
          created_at: string;
          id: string;
          line_kind: Database["public"]["Enums"]["line_kind"];
          match_reason: string | null;
          match_status: Database["public"]["Enums"]["match_status"];
          matched_policy_id: string | null;
          member_count: number | null;
          policy_number: string | null;
          posted: boolean;
          premium_cents: number | null;
          raw: Json;
          row_index: number;
          statement_id: string;
          subscriber_dob: string | null;
          subscriber_name: string | null;
        };
        Insert: {
          amount_cents: number;
          business_type?: Database["public"]["Enums"]["business_type"] | null;
          carrier_member_id?: string | null;
          created_at?: string;
          id?: string;
          line_kind?: Database["public"]["Enums"]["line_kind"];
          match_reason?: string | null;
          match_status?: Database["public"]["Enums"]["match_status"];
          matched_policy_id?: string | null;
          member_count?: number | null;
          policy_number?: string | null;
          posted?: boolean;
          premium_cents?: number | null;
          raw: Json;
          row_index: number;
          statement_id: string;
          subscriber_dob?: string | null;
          subscriber_name?: string | null;
        };
        Update: {
          amount_cents?: number;
          business_type?: Database["public"]["Enums"]["business_type"] | null;
          carrier_member_id?: string | null;
          created_at?: string;
          id?: string;
          line_kind?: Database["public"]["Enums"]["line_kind"];
          match_reason?: string | null;
          match_status?: Database["public"]["Enums"]["match_status"];
          matched_policy_id?: string | null;
          member_count?: number | null;
          policy_number?: string | null;
          posted?: boolean;
          premium_cents?: number | null;
          raw?: Json;
          row_index?: number;
          statement_id?: string;
          subscriber_dob?: string | null;
          subscriber_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "statement_lines_matched_policy_id_fkey";
            columns: ["matched_policy_id"];
            isOneToOne: false;
            referencedRelation: "policies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "statement_lines_statement_id_fkey";
            columns: ["statement_id"];
            isOneToOne: false;
            referencedRelation: "commission_statements";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_access_agent: {
        Args: { target_agent_id: string };
        Returns: boolean;
      };
      current_agency_id: {
        Args: never;
        Returns: string;
      };
      current_agent_id: {
        Args: never;
        Returns: string;
      };
      current_app_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["app_role"];
      };
      has_role: {
        Args: { roles: Database["public"]["Enums"]["app_role"][] };
        Returns: boolean;
      };
      is_active_user: {
        Args: never;
        Returns: boolean;
      };
      notify_roles: {
        Args: {
          p_body: string;
          p_entity_id: string;
          p_entity_type: string;
          p_priority: Database["public"]["Enums"]["notification_priority"];
          p_roles: Database["public"]["Enums"]["app_role"][];
          p_title: string;
          p_type: Database["public"]["Enums"]["notification_type"];
        };
        Returns: undefined;
      };
      post_statement: {
        Args: { p_statement_id: string; p_entries: Json };
        Returns: undefined;
      };
      void_statement: {
        Args: { p_statement_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      agency_status: "active" | "inactive";
      agent_status: "active" | "inactive" | "terminated";
      app_role: "admin" | "manager" | "agent" | "agency_owner";
      business_type: "new_business" | "renewal";
      carrier_status: "active" | "inactive";
      client_status: "prospect" | "active" | "inactive";
      ledger_entry_kind:
        | "agent_commission"
        | "agency_commission"
        | "house_commission"
        | "agency_override"
        | "house_override";
      line_kind: "commission" | "override" | "adjustment";
      match_status: "unmatched" | "auto_matched" | "manual_matched" | "ignored";
      notification_priority: "normal" | "high";
      notification_type:
        | "client_created"
        | "policy_lapsed"
        | "statement_posted"
        | "lines_unmatched"
        | "payout_finalized";
      payee_type: "agent" | "agency" | "house";
      payout_status: "open" | "finalized" | "paid";
      policy_status:
        | "draft"
        | "submitted"
        | "active"
        | "grace"
        | "lapsed"
        | "cancelled"
        | "terminated"
        | "renewed";
      rate_type: "pmpm" | "percent_of_premium";
      statement_status: "draft" | "matching" | "posted" | "void";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
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
    : never = never,
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
    : never = never,
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      agency_status: ["active", "inactive"],
      agent_status: ["active", "inactive", "terminated"],
      app_role: ["admin", "manager", "agent", "agency_owner"],
      business_type: ["new_business", "renewal"],
      carrier_status: ["active", "inactive"],
      client_status: ["prospect", "active", "inactive"],
      ledger_entry_kind: [
        "agent_commission",
        "agency_commission",
        "house_commission",
        "agency_override",
        "house_override",
      ],
      line_kind: ["commission", "override", "adjustment"],
      match_status: ["unmatched", "auto_matched", "manual_matched", "ignored"],
      notification_priority: ["normal", "high"],
      notification_type: [
        "client_created",
        "policy_lapsed",
        "statement_posted",
        "lines_unmatched",
        "payout_finalized",
      ],
      payee_type: ["agent", "agency", "house"],
      payout_status: ["open", "finalized", "paid"],
      policy_status: [
        "draft",
        "submitted",
        "active",
        "grace",
        "lapsed",
        "cancelled",
        "terminated",
        "renewed",
      ],
      rate_type: ["pmpm", "percent_of_premium"],
      statement_status: ["draft", "matching", "posted", "void"],
    },
  },
} as const;
