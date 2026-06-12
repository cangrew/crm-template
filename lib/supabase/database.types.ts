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
      contacts: {
        Row: {
          company: string | null;
          created_at: string;
          created_by: string | null;
          email: string | null;
          id: string;
          name: string;
          notes: string | null;
          phone: string | null;
          status: Database["public"]["Enums"]["contact_status"];
          updated_at: string;
        };
        Insert: {
          company?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          phone?: string | null;
          status?: Database["public"]["Enums"]["contact_status"];
          updated_at?: string;
        };
        Update: {
          company?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          status?: Database["public"]["Enums"]["contact_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          contact_id: string | null;
          created_at: string;
          id: string;
          kind: string;
          storage_path: string;
          uploaded_by: string | null;
        };
        Insert: {
          contact_id?: string | null;
          created_at?: string;
          id?: string;
          kind: string;
          storage_path: string;
          uploaded_by?: string | null;
        };
        Update: {
          contact_id?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          storage_path?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "documents_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
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
    };
    Enums: {
      agency_status: "active" | "inactive";
      agent_status: "active" | "inactive" | "terminated";
      app_role: "admin" | "manager" | "agent" | "agency_owner";
      contact_status: "lead" | "active" | "at_risk" | "closed";
      notification_priority: "normal" | "high";
      notification_type: "contact_created" | "contact_at_risk" | "contact_closed";
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
      contact_status: ["lead", "active", "at_risk", "closed"],
      notification_priority: ["normal", "high"],
      notification_type: ["contact_created", "contact_at_risk", "contact_closed"],
    },
  },
} as const;
