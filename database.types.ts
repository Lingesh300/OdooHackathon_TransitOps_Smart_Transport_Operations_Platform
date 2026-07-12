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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      drivers: {
        Row: {
          contact_no: string | null
          id: string
          license_category: string | null
          license_expiry: string
          license_no: string
          name: string
          safety_score: number | null
          status: Database["public"]["Enums"]["driver_status"]
          trip_completion_pct: number | null
        }
        Insert: {
          contact_no?: string | null
          id?: string
          license_category?: string | null
          license_expiry: string
          license_no: string
          name: string
          safety_score?: number | null
          status?: Database["public"]["Enums"]["driver_status"]
          trip_completion_pct?: number | null
        }
        Update: {
          contact_no?: string | null
          id?: string
          license_category?: string | null
          license_expiry?: string
          license_no?: string
          name?: string
          safety_score?: number | null
          status?: Database["public"]["Enums"]["driver_status"]
          trip_completion_pct?: number | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          maintenance_linked: number | null
          other: number | null
          status: Database["public"]["Enums"]["expense_status"]
          toll: number | null
          trip_id: string | null
          vehicle_id: string
        }
        Insert: {
          id?: string
          maintenance_linked?: number | null
          other?: number | null
          status?: Database["public"]["Enums"]["expense_status"]
          toll?: number | null
          trip_id?: string | null
          vehicle_id: string
        }
        Update: {
          id?: string
          maintenance_linked?: number | null
          other?: number | null
          status?: Database["public"]["Enums"]["expense_status"]
          toll?: number | null
          trip_id?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_roi"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_logs: {
        Row: {
          date: string
          fuel_cost: number | null
          id: string
          liters: number | null
          trip_id: string | null
          vehicle_id: string
        }
        Insert: {
          date?: string
          fuel_cost?: number | null
          id?: string
          liters?: number | null
          trip_id?: string | null
          vehicle_id: string
        }
        Update: {
          date?: string
          fuel_cost?: number | null
          id?: string
          liters?: number | null
          trip_id?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_roi"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_logs: {
        Row: {
          cost: number | null
          date: string
          id: string
          service_type: string
          status: Database["public"]["Enums"]["maintenance_status"]
          vehicle_id: string
        }
        Insert: {
          cost?: number | null
          date?: string
          id?: string
          service_type: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          vehicle_id: string
        }
        Update: {
          cost?: number | null
          date?: string
          id?: string
          service_type?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_roi"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "maintenance_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      rbac_permissions: {
        Row: {
          access_level: Database["public"]["Enums"]["rbac_access_level"]
          id: number
          module: Database["public"]["Enums"]["rbac_module"]
          role_id: number
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["rbac_access_level"]
          id?: number
          module: Database["public"]["Enums"]["rbac_module"]
          role_id: number
        }
        Update: {
          access_level?: Database["public"]["Enums"]["rbac_access_level"]
          id?: number
          module?: Database["public"]["Enums"]["rbac_module"]
          role_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "rbac_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          id: number
          name: Database["public"]["Enums"]["role_name"]
        }
        Insert: {
          id?: number
          name: Database["public"]["Enums"]["role_name"]
        }
        Update: {
          id?: number
          name?: Database["public"]["Enums"]["role_name"]
        }
        Relationships: []
      }
      trips: {
        Row: {
          actual_distance_km: number | null
          cargo_weight_kg: number
          completed_at: string | null
          created_at: string
          destination: string
          dispatched_at: string | null
          driver_id: string | null
          eta: string | null
          fuel_consumed_l: number | null
          id: string
          planned_distance_km: number | null
          revenue: number | null
          source: string
          status: Database["public"]["Enums"]["trip_status"]
          vehicle_id: string | null
        }
        Insert: {
          actual_distance_km?: number | null
          cargo_weight_kg: number
          completed_at?: string | null
          created_at?: string
          destination: string
          dispatched_at?: string | null
          driver_id?: string | null
          eta?: string | null
          fuel_consumed_l?: number | null
          id?: string
          planned_distance_km?: number | null
          revenue?: number | null
          source: string
          status?: Database["public"]["Enums"]["trip_status"]
          vehicle_id?: string | null
        }
        Update: {
          actual_distance_km?: number | null
          cargo_weight_kg?: number
          completed_at?: string | null
          created_at?: string
          destination?: string
          dispatched_at?: string | null
          driver_id?: string | null
          eta?: string | null
          fuel_consumed_l?: number | null
          id?: string
          planned_distance_km?: number | null
          revenue?: number | null
          source?: string
          status?: Database["public"]["Enums"]["trip_status"]
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_roi"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          failed_login_count: number
          id: string
          locked_until: string | null
          name: string
          password_hash: string
          role_id: number | null
        }
        Insert: {
          created_at?: string
          email: string
          failed_login_count?: number
          id?: string
          locked_until?: string | null
          name: string
          password_hash: string
          role_id?: number | null
        }
        Update: {
          created_at?: string
          email?: string
          failed_login_count?: number
          id?: string
          locked_until?: string | null
          name?: string
          password_hash?: string
          role_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          acquisition_cost: number | null
          created_at: string
          id: string
          max_capacity_kg: number
          name_model: string | null
          odometer_km: number
          reg_no: string
          status: Database["public"]["Enums"]["vehicle_status"]
          type: Database["public"]["Enums"]["vehicle_type"]
          updated_at: string
        }
        Insert: {
          acquisition_cost?: number | null
          created_at?: string
          id?: string
          max_capacity_kg: number
          name_model?: string | null
          odometer_km?: number
          reg_no: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          type: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string
        }
        Update: {
          acquisition_cost?: number | null
          created_at?: string
          id?: string
          max_capacity_kg?: number
          name_model?: string | null
          odometer_km?: number
          reg_no?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          type?: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      vehicle_fuel_totals: {
        Row: {
          total_fuel_cost: number | null
          total_liters: number | null
          vehicle_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_roi"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_maintenance_totals: {
        Row: {
          total_maintenance_cost: number | null
          vehicle_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_roi"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "maintenance_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_revenue_totals: {
        Row: {
          total_revenue: number | null
          vehicle_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_roi"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_roi: {
        Row: {
          acquisition_cost: number | null
          fuel_cost: number | null
          maintenance_cost: number | null
          reg_no: string | null
          revenue: number | null
          vehicle_id: string | null
          vehicle_roi: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      next_trip_id: { Args: never; Returns: string }
    }
    Enums: {
      driver_status: "Available" | "On Trip" | "Off Duty" | "Suspended"
      expense_status: "Available" | "Completed"
      maintenance_status: "In Shop" | "Completed"
      rbac_access_level: "none" | "view" | "edit"
      rbac_module: "fleet" | "drivers" | "trips" | "fuel_expenses" | "analytics"
      role_name:
        | "Fleet Manager"
        | "Dispatcher"
        | "Safety Officer"
        | "FinancialAnalyst"
      trip_status: "Draft" | "Dispatched" | "Completed" | "Cancelled"
      vehicle_status: "Available" | "On Trip" | "In Shop" | "Retired"
      vehicle_type: "Van" | "Truck" | "Mini" | "Other"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      driver_status: ["Available", "On Trip", "Off Duty", "Suspended"],
      expense_status: ["Available", "Completed"],
      maintenance_status: ["In Shop", "Completed"],
      rbac_access_level: ["none", "view", "edit"],
      rbac_module: ["fleet", "drivers", "trips", "fuel_expenses", "analytics"],
      role_name: [
        "Fleet Manager",
        "Dispatcher",
        "Safety Officer",
        "FinancialAnalyst",
      ],
      trip_status: ["Draft", "Dispatched", "Completed", "Cancelled"],
      vehicle_status: ["Available", "On Trip", "In Shop", "Retired"],
      vehicle_type: ["Van", "Truck", "Mini", "Other"],
    },
  },
} as const
