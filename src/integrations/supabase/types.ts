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
  public: {
    Tables: {
      admin_notification_dismissals: {
        Row: {
          admin_user_id: string
          dismissed_at: string
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          admin_user_id: string
          dismissed_at?: string
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          admin_user_id?: string
          dismissed_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          inquiry_type: string
          message: string
          name: string
          phone: string | null
          status: string
          team_size: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          inquiry_type?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          team_size?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          inquiry_type?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          team_size?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_subscribers: {
        Row: {
          email: string
          id: string
          profile_id: string
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          profile_id: string
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          profile_id?: string
          subscribed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_subscribers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_subscribers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      link_clicks: {
        Row: {
          browser: string | null
          city: string | null
          clicked_at: string
          country: string | null
          device_type: string | null
          id: string
          link_id: string
          os: string | null
          profile_id: string
          referrer: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          clicked_at?: string
          country?: string | null
          device_type?: string | null
          id?: string
          link_id: string
          os?: string | null
          profile_id: string
          referrer?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          clicked_at?: string
          country?: string | null
          device_type?: string | null
          id?: string
          link_id?: string
          os?: string | null
          profile_id?: string
          referrer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_clicks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_clicks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      link_groups: {
        Row: {
          created_at: string
          id: string
          is_collapsed: boolean | null
          name: string
          position: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_collapsed?: boolean | null
          name: string
          position?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_collapsed?: boolean | null
          name?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      links: {
        Row: {
          click_count: number | null
          created_at: string | null
          group_id: string | null
          id: string
          is_featured: boolean | null
          position: number
          scheduled_end: string | null
          scheduled_start: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          url: string | null
          user_id: string
          visible: boolean | null
        }
        Insert: {
          click_count?: number | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          is_featured?: boolean | null
          position?: number
          scheduled_end?: string | null
          scheduled_start?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
          user_id: string
          visible?: boolean | null
        }
        Update: {
          click_count?: number | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          is_featured?: boolean | null
          position?: number
          scheduled_end?: string | null
          scheduled_start?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
          user_id?: string
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "links_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "link_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      nfc_catalog_products: {
        Row: {
          base_price: number
          category: string
          created_at: string
          description: string
          gradient: string
          id: string
          is_active: boolean
          name: string
          photo_url: string | null
          position: number
          slug: string
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          base_price?: number
          category?: string
          created_at?: string
          description?: string
          gradient?: string
          id?: string
          is_active?: boolean
          name: string
          photo_url?: string | null
          position?: number
          slug: string
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          base_price?: number
          category?: string
          created_at?: string
          description?: string
          gradient?: string
          id?: string
          is_active?: boolean
          name?: string
          photo_url?: string | null
          position?: number
          slug?: string
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      nfc_orders: {
        Row: {
          created_at: string
          id: string
          items: Json
          notes: string | null
          order_number: string
          shipping_cost: number
          shipping_info: Json
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          order_number: string
          shipping_cost?: number
          shipping_info?: Json
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          shipping_cost?: number
          shipping_info?: Json
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nfc_product_drafts: {
        Row: {
          created_at: string
          customization: Json
          id: string
          name: string | null
          product_id: string
          product_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customization?: Json
          id?: string
          name?: string | null
          product_id: string
          product_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customization?: Json
          id?: string
          name?: string | null
          product_id?: string
          product_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pro_upgrade_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          feature_context: string | null
          id: string
          requested_plan: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          feature_context?: string | null
          id?: string
          requested_plan?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          feature_context?: string | null
          id?: string
          requested_plan?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          content: string | null
          created_at: string
          helpful_count: number | null
          id: string
          product_id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_templates: {
        Row: {
          animation_intensity: number | null
          animation_speed: number | null
          animation_type: string | null
          apply_count: number
          category: string
          created_at: string
          description: string | null
          gradient_direction: string | null
          id: string
          is_premium: boolean | null
          name: string
          preview_image_url: string | null
          required_plan: string
          theme_gradient: string
          theme_name: string
          view_count: number
        }
        Insert: {
          animation_intensity?: number | null
          animation_speed?: number | null
          animation_type?: string | null
          apply_count?: number
          category: string
          created_at?: string
          description?: string | null
          gradient_direction?: string | null
          id?: string
          is_premium?: boolean | null
          name: string
          preview_image_url?: string | null
          required_plan?: string
          theme_gradient: string
          theme_name: string
          view_count?: number
        }
        Update: {
          animation_intensity?: number | null
          animation_speed?: number | null
          animation_type?: string | null
          apply_count?: number
          category?: string
          created_at?: string
          description?: string | null
          gradient_direction?: string | null
          id?: string
          is_premium?: boolean | null
          name?: string
          preview_image_url?: string | null
          required_plan?: string
          theme_gradient?: string
          theme_name?: string
          view_count?: number
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          id: string
          profile_id: string
          referrer: string | null
          user_agent: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          animation_intensity: number | null
          animation_speed: number | null
          animation_type: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          custom_accent_color: string | null
          custom_background_type: string | null
          custom_background_url: string | null
          custom_bg_color: string | null
          email_collection_enabled: boolean | null
          gradient_direction: string | null
          id: string
          motion_enabled: boolean
          plan: string
          social_links: Json | null
          theme_gradient: string | null
          theme_name: string | null
          theme_preference: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          username: string
          welcome_email_attempts: number
          welcome_email_last_attempt_at: string | null
          welcome_email_last_error: string | null
          welcome_email_sent_at: string | null
        }
        Insert: {
          animation_intensity?: number | null
          animation_speed?: number | null
          animation_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          custom_accent_color?: string | null
          custom_background_type?: string | null
          custom_background_url?: string | null
          custom_bg_color?: string | null
          email_collection_enabled?: boolean | null
          gradient_direction?: string | null
          id?: string
          motion_enabled?: boolean
          plan?: string
          social_links?: Json | null
          theme_gradient?: string | null
          theme_name?: string | null
          theme_preference?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          username: string
          welcome_email_attempts?: number
          welcome_email_last_attempt_at?: string | null
          welcome_email_last_error?: string | null
          welcome_email_sent_at?: string | null
        }
        Update: {
          animation_intensity?: number | null
          animation_speed?: number | null
          animation_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          custom_accent_color?: string | null
          custom_background_type?: string | null
          custom_background_url?: string | null
          custom_bg_color?: string | null
          email_collection_enabled?: boolean | null
          gradient_direction?: string | null
          id?: string
          motion_enabled?: boolean
          plan?: string
          social_links?: Json | null
          theme_gradient?: string | null
          theme_name?: string | null
          theme_preference?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string
          welcome_email_attempts?: number
          welcome_email_last_attempt_at?: string | null
          welcome_email_last_error?: string | null
          welcome_email_sent_at?: string | null
        }
        Relationships: []
      }
      promo_settings: {
        Row: {
          current_count: number
          enabled: boolean
          id: number
          max_count: number
          popup_message: string
          popup_title: string
          start_count: number
          updated_at: string
        }
        Insert: {
          current_count?: number
          enabled?: boolean
          id?: number
          max_count?: number
          popup_message?: string
          popup_title?: string
          start_count?: number
          updated_at?: string
        }
        Update: {
          current_count?: number
          enabled?: boolean
          id?: number
          max_count?: number
          popup_message?: string
          popup_title?: string
          start_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      user_theme_presets: {
        Row: {
          animation_intensity: number | null
          animation_speed: number | null
          animation_type: string | null
          created_at: string
          custom_accent_color: string | null
          custom_bg_color: string | null
          gradient_direction: string | null
          id: string
          name: string
          theme_gradient: string
          theme_name: string
          user_id: string
        }
        Insert: {
          animation_intensity?: number | null
          animation_speed?: number | null
          animation_type?: string | null
          created_at?: string
          custom_accent_color?: string | null
          custom_bg_color?: string | null
          gradient_direction?: string | null
          id?: string
          name: string
          theme_gradient: string
          theme_name: string
          user_id: string
        }
        Update: {
          animation_intensity?: number | null
          animation_speed?: number | null
          animation_type?: string | null
          created_at?: string
          custom_accent_color?: string | null
          custom_bg_color?: string | null
          gradient_direction?: string | null
          id?: string
          name?: string
          theme_gradient?: string
          theme_name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      nfc_catalog_products_public: {
        Row: {
          base_price: number | null
          category: string | null
          created_at: string | null
          description: string | null
          gradient: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          photo_url: string | null
          position: number | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          gradient?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          photo_url?: string | null
          position?: number | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          gradient?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          photo_url?: string | null
          position?: number | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          animation_intensity: number | null
          animation_speed: number | null
          animation_type: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          custom_accent_color: string | null
          custom_bg_color: string | null
          email_collection_enabled: boolean | null
          gradient_direction: string | null
          id: string | null
          social_links: Json | null
          theme_gradient: string | null
          theme_name: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          animation_intensity?: number | null
          animation_speed?: number | null
          animation_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          custom_accent_color?: string | null
          custom_bg_color?: string | null
          email_collection_enabled?: boolean | null
          gradient_direction?: string | null
          id?: string | null
          social_links?: Json | null
          theme_gradient?: string | null
          theme_name?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          animation_intensity?: number | null
          animation_speed?: number | null
          animation_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          custom_accent_color?: string | null
          custom_bg_color?: string | null
          email_collection_enabled?: boolean | null
          gradient_direction?: string | null
          id?: string | null
          social_links?: Json | null
          theme_gradient?: string | null
          theme_name?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_link_click: { Args: { link_uuid: string }; Returns: undefined }
      increment_template_apply: {
        Args: { template_uuid: string }
        Returns: undefined
      }
      increment_template_view: {
        Args: { template_uuid: string }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
