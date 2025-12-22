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
      audit_logs: {
        Row: {
          action: string
          branch_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          branch_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          branch_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          closing_time: string | null
          code: string
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_main: boolean | null
          name: string
          opening_time: string | null
          phone: string | null
          settings: Json | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          closing_time?: string | null
          code: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_main?: boolean | null
          name: string
          opening_time?: string | null
          phone?: string | null
          settings?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          closing_time?: string | null
          code?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_main?: boolean | null
          name?: string
          opening_time?: string | null
          phone?: string | null
          settings?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cashback_history: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          customer_id: string
          id: string
          notes: string | null
          transaction_id: string | null
          type: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          transaction_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          transaction_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashback_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashback_history_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          name_en: string | null
          name_ru: string | null
          name_uz: string | null
          parent_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          name_en?: string | null
          name_ru?: string | null
          name_uz?: string | null
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          name_ru?: string | null
          name_uz?: string | null
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          cashback_balance: number | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string
          gender: string | null
          id: string
          is_active: boolean | null
          loyalty_points: number | null
          loyalty_tier: Database["public"]["Enums"]["loyalty_tier"] | null
          notes: string | null
          phone: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cashback_balance?: number | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          loyalty_points?: number | null
          loyalty_tier?: Database["public"]["Enums"]["loyalty_tier"] | null
          notes?: string | null
          phone?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cashback_balance?: number | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          loyalty_points?: number | null
          loyalty_tier?: Database["public"]["Enums"]["loyalty_tier"] | null
          notes?: string | null
          phone?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      held_carts: {
        Row: {
          branch_id: string
          cart_data: Json
          cashier_id: string
          created_at: string | null
          customer_id: string | null
          id: string
          notes: string | null
        }
        Insert: {
          branch_id: string
          cart_data: Json
          cashier_id: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          branch_id?: string
          cart_data?: Json
          cashier_id?: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "held_carts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "held_carts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json | null
          barcode: string | null
          cost_price: number | null
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          product_id: string
          selling_price: number | null
          sku: string
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          barcode?: string | null
          cost_price?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          product_id: string
          selling_price?: number | null
          sku: string
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          barcode?: string | null
          cost_price?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          product_id?: string
          selling_price?: number | null
          sku?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand_id: string | null
          category_id: string | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          dimensions: Json | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          is_service: boolean | null
          max_stock: number | null
          min_price: number | null
          min_stock: number | null
          name: string
          name_en: string | null
          name_ru: string | null
          name_uz: string | null
          selling_price: number
          sku: string
          supplier_id: string | null
          track_inventory: boolean | null
          unit: string | null
          updated_at: string | null
          vat_rate: number | null
          weight: number | null
        }
        Insert: {
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_service?: boolean | null
          max_stock?: number | null
          min_price?: number | null
          min_stock?: number | null
          name: string
          name_en?: string | null
          name_ru?: string | null
          name_uz?: string | null
          selling_price: number
          sku: string
          supplier_id?: string | null
          track_inventory?: boolean | null
          unit?: string | null
          updated_at?: string | null
          vat_rate?: number | null
          weight?: number | null
        }
        Update: {
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_service?: boolean | null
          max_stock?: number | null
          min_price?: number | null
          min_stock?: number | null
          name?: string
          name_en?: string | null
          name_ru?: string | null
          name_uz?: string | null
          selling_price?: number
          sku?: string
          supplier_id?: string | null
          track_inventory?: boolean | null
          unit?: string | null
          updated_at?: string | null
          vat_rate?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          language: string | null
          phone: string | null
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          language?: string | null
          phone?: string | null
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          language?: string | null
          phone?: string | null
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      receipt_templates: {
        Row: {
          branch_id: string | null
          created_at: string | null
          footer_text: string | null
          header_text: string | null
          id: string
          is_default: boolean | null
          logo_url: string | null
          name: string
          settings: Json | null
          show_logo: boolean | null
          template_type: string | null
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name: string
          settings?: Json | null
          show_logo?: boolean | null
          template_type?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name?: string
          settings?: Json | null
          show_logo?: boolean | null
          template_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipt_templates_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      stock: {
        Row: {
          branch_id: string
          created_at: string | null
          id: string
          last_counted_at: string | null
          product_id: string
          quantity: number | null
          reserved_quantity: number | null
          updated_at: string | null
          variant_id: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          id?: string
          last_counted_at?: string | null
          product_id: string
          quantity?: number | null
          reserved_quantity?: number | null
          updated_at?: string | null
          variant_id?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          id?: string
          last_counted_at?: string | null
          product_id?: string
          quantity?: number | null
          reserved_quantity?: number | null
          updated_at?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          branch_id: string
          cost_price: number | null
          created_at: string | null
          created_by: string | null
          from_branch_id: string | null
          id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          to_branch_id: string | null
          variant_id: string | null
        }
        Insert: {
          branch_id: string
          cost_price?: number | null
          created_at?: string | null
          created_by?: string | null
          from_branch_id?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          to_branch_id?: string | null
          variant_id?: string | null
        }
        Update: {
          branch_id?: string
          cost_price?: number | null
          created_at?: string | null
          created_by?: string | null
          from_branch_id?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          to_branch_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_to_branch_id_fkey"
            columns: ["to_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          inn: string | null
          is_active: boolean | null
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transaction_items: {
        Row: {
          cost_price: number | null
          created_at: string | null
          discount_amount: number | null
          id: string
          product_id: string
          product_name: string
          quantity: number
          sku: string
          total_amount: number
          transaction_id: string
          unit_price: number
          variant_id: string | null
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          cost_price?: number | null
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          product_id: string
          product_name: string
          quantity: number
          sku: string
          total_amount: number
          transaction_id: string
          unit_price: number
          variant_id?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          cost_price?: number | null
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          sku?: string
          total_amount?: number
          transaction_id?: string
          unit_price?: number
          variant_id?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          provider_response: Json | null
          reference_number: string | null
          transaction_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          provider_response?: Json | null
          reference_number?: string | null
          transaction_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          provider_response?: Json | null
          reference_number?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          branch_id: string
          cancelled_at: string | null
          cashback_earned: number | null
          cashback_used: number | null
          cashier_id: string
          change_amount: number | null
          completed_at: string | null
          created_at: string | null
          customer_id: string | null
          discount_amount: number | null
          discount_percent: number | null
          fiscal_receipt_id: string | null
          fiscal_receipt_url: string | null
          held_at: string | null
          id: string
          notes: string | null
          paid_amount: number | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          subtotal: number
          total_amount: number
          transaction_number: string
          updated_at: string | null
          vat_amount: number | null
        }
        Insert: {
          branch_id: string
          cancelled_at?: string | null
          cashback_earned?: number | null
          cashback_used?: number | null
          cashier_id: string
          change_amount?: number | null
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          fiscal_receipt_id?: string | null
          fiscal_receipt_url?: string | null
          held_at?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          subtotal: number
          total_amount: number
          transaction_number: string
          updated_at?: string | null
          vat_amount?: number | null
        }
        Update: {
          branch_id?: string
          cancelled_at?: string | null
          cashback_earned?: number | null
          cashback_used?: number | null
          cashier_id?: string
          change_amount?: number | null
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          fiscal_receipt_id?: string | null
          fiscal_receipt_url?: string | null
          held_at?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          subtotal?: number
          total_amount?: number
          transaction_number?: string
          updated_at?: string | null
          vat_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_branches: {
        Row: {
          branch_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          user_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          user_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_branches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      generate_transaction_number: { Args: never; Returns: string }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
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
      app_role:
        | "super_admin"
        | "owner"
        | "manager"
        | "cashier"
        | "accountant"
        | "warehouse"
      loyalty_tier: "bronze" | "silver" | "gold" | "vip"
      payment_method: "cash" | "humo" | "uzcard" | "click" | "payme" | "uzum"
      stock_movement_type:
        | "stock_in"
        | "stock_out"
        | "transfer"
        | "adjustment"
        | "sale"
        | "return"
      transaction_status:
        | "completed"
        | "pending"
        | "cancelled"
        | "refunded"
        | "held"
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
      app_role: [
        "super_admin",
        "owner",
        "manager",
        "cashier",
        "accountant",
        "warehouse",
      ],
      loyalty_tier: ["bronze", "silver", "gold", "vip"],
      payment_method: ["cash", "humo", "uzcard", "click", "payme", "uzum"],
      stock_movement_type: [
        "stock_in",
        "stock_out",
        "transfer",
        "adjustment",
        "sale",
        "return",
      ],
      transaction_status: [
        "completed",
        "pending",
        "cancelled",
        "refunded",
        "held",
      ],
    },
  },
} as const
