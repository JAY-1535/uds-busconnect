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
      announcements: {
        Row: {
          campus: Database["public"]["Enums"]["campus_type"] | null
          created_at: string
          id: string
          message: string
          sender_id: string
          target_trip_id: string | null
          target_type: string
          title: string
        }
        Insert: {
          campus?: Database["public"]["Enums"]["campus_type"] | null
          created_at?: string
          id?: string
          message: string
          sender_id: string
          target_trip_id?: string | null
          target_type?: string
          title: string
        }
        Update: {
          campus?: Database["public"]["Enums"]["campus_type"] | null
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          target_trip_id?: string | null
          target_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_target_trip_id_fkey"
            columns: ["target_trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          emergency_contact: string
          full_name: string
          has_luggage: boolean | null
          id: string
          luggage_count: number | null
          luggage_id: string | null
          luggage_tagging_fee: number | null
          payment_reference: string | null
          phone: string
          seat_number: number
          status: Database["public"]["Enums"]["booking_status"]
          student_class: string
          student_id: string
          total_amount: number
          travel_safe_fee: number | null
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emergency_contact: string
          full_name: string
          has_luggage?: boolean | null
          id?: string
          luggage_count?: number | null
          luggage_id?: string | null
          luggage_tagging_fee?: number | null
          payment_reference?: string | null
          phone: string
          seat_number: number
          status?: Database["public"]["Enums"]["booking_status"]
          student_class: string
          student_id: string
          total_amount: number
          travel_safe_fee?: number | null
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emergency_contact?: string
          full_name?: string
          has_luggage?: boolean | null
          id?: string
          luggage_count?: number | null
          luggage_id?: string | null
          luggage_tagging_fee?: number | null
          payment_reference?: string | null
          phone?: string
          seat_number?: number
          status?: Database["public"]["Enums"]["booking_status"]
          student_class?: string
          student_id?: string
          total_amount?: number
          travel_safe_fee?: number | null
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      bus_groups: {
        Row: {
          campus: Database["public"]["Enums"]["campus_type"]
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          organizer_id: string
          updated_at: string
          whatsapp_group_link: string | null
        }
        Insert: {
          campus: Database["public"]["Enums"]["campus_type"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          organizer_id: string
          updated_at?: string
          whatsapp_group_link?: string | null
        }
        Update: {
          campus?: Database["public"]["Enums"]["campus_type"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          organizer_id?: string
          updated_at?: string
          whatsapp_group_link?: string | null
        }
        Relationships: []
      }
      buses: {
        Row: {
          bus_group_id: string
          bus_number: string
          capacity: number
          created_at: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          bus_group_id: string
          bus_number: string
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          bus_group_id?: string
          bus_number?: string
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "buses_bus_group_id_fkey"
            columns: ["bus_group_id"]
            isOneToOne: false
            referencedRelation: "bus_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      damage_claims: {
        Row: {
          amount_approved: number | null
          amount_claimed: number | null
          booking_id: string
          created_at: string
          description: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["claim_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_approved?: number | null
          amount_claimed?: number | null
          booking_id: string
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_approved?: number | null
          amount_claimed?: number | null
          booking_id?: string
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "damage_claims_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_permissions: {
        Row: {
          created_at: string
          id: string
          section: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          section: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          section?: string
          user_id?: string
        }
        Relationships: []
      }
      organizer_applications: {
        Row: {
          bus_group_name: string
          campus: string
          created_at: string
          email: string
          experience: string | null
          full_name: string
          id: string
          phone: string
          reason: string
          review_notes: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bus_group_name: string
          campus: string
          created_at?: string
          email: string
          experience?: string | null
          full_name: string
          id?: string
          phone: string
          reason: string
          review_notes?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bus_group_name?: string
          campus?: string
          created_at?: string
          email?: string
          experience?: string | null
          full_name?: string
          id?: string
          phone?: string
          reason?: string
          review_notes?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          payment_method: string | null
          payment_reference: string | null
          paystack_reference: string | null
          status: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          paystack_reference?: string | null
          status?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          paystack_reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          campus: Database["public"]["Enums"]["campus_type"] | null
          created_at: string
          email: string | null
          emergency_contact: string | null
          full_name: string
          id: string
          phone: string | null
          student_class: string | null
          student_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campus?: Database["public"]["Enums"]["campus_type"] | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          full_name: string
          id?: string
          phone?: string | null
          student_class?: string | null
          student_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campus?: Database["public"]["Enums"]["campus_type"] | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          student_class?: string | null
          student_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      representatives: {
        Row: {
          campus: Database["public"]["Enums"]["campus_type"]
          created_at: string
          full_name: string
          id: string
          is_active: boolean | null
          phone: string
          station_assignment: string | null
          user_id: string
        }
        Insert: {
          campus: Database["public"]["Enums"]["campus_type"]
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean | null
          phone: string
          station_assignment?: string | null
          user_id: string
        }
        Update: {
          campus?: Database["public"]["Enums"]["campus_type"]
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string
          station_assignment?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          available_seats: number
          bus_group_id: string
          bus_id: string | null
          campus: Database["public"]["Enums"]["campus_type"]
          created_at: string
          departure_date: string
          departure_time: string
          destination: string
          id: string
          origin: string
          person_in_charge: string
          person_in_charge_contact: string
          price: number
          share_link_id: string | null
          status: Database["public"]["Enums"]["trip_status"]
          total_seats: number
          updated_at: string
        }
        Insert: {
          available_seats: number
          bus_group_id: string
          bus_id?: string | null
          campus: Database["public"]["Enums"]["campus_type"]
          created_at?: string
          departure_date: string
          departure_time: string
          destination: string
          id?: string
          origin: string
          person_in_charge: string
          person_in_charge_contact: string
          price: number
          share_link_id?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          total_seats: number
          updated_at?: string
        }
        Update: {
          available_seats?: number
          bus_group_id?: string
          bus_id?: string | null
          campus?: Database["public"]["Enums"]["campus_type"]
          created_at?: string
          departure_date?: string
          departure_time?: string
          destination?: string
          id?: string
          origin?: string
          person_in_charge?: string
          person_in_charge_contact?: string
          price?: number
          share_link_id?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          total_seats?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_bus_group_id_fkey"
            columns: ["bus_group_id"]
            isOneToOne: false
            referencedRelation: "bus_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          campus: Database["public"]["Enums"]["campus_type"] | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          campus?: Database["public"]["Enums"]["campus_type"] | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          campus?: Database["public"]["Enums"]["campus_type"] | null
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
      approve_organizer_application: {
        Args: { admin_notes?: string; application_id: string }
        Returns: boolean
      }
      decrement_available_seats: {
        Args: { trip_id_param: string }
        Returns: undefined
      }
      generate_luggage_id: {
        Args: { organizer_name: string; seat_num: number; stu_id: string }
        Returns: string
      }
      get_user_campus: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["campus_type"]
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
      app_role: "student" | "organizer" | "admin"
      booking_status: "provisional" | "confirmed" | "cancelled"
      campus_type: "nyankpala" | "tamale"
      claim_status: "pending" | "approved" | "paid" | "rejected"
      trip_status: "pending" | "approved" | "denied" | "cancelled" | "completed"
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
      app_role: ["student", "organizer", "admin"],
      booking_status: ["provisional", "confirmed", "cancelled"],
      campus_type: ["nyankpala", "tamale"],
      claim_status: ["pending", "approved", "paid", "rejected"],
      trip_status: ["pending", "approved", "denied", "cancelled", "completed"],
    },
  },
} as const

