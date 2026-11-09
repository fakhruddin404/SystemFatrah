export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// NOTE: kept in sync by hand with supabase/migrations. Regenerate with
// `supabase gen types typescript --linked` once the migrations are applied.
export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_sizes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          price_override_myr: number | null
          product_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          price_override_myr?: number | null
          product_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          price_override_myr?: number | null
          product_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_sizes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          aspect_class: string
          bg: string
          cloudinary_public_id: string | null
          created_at: string
          description_en: string
          description_ms: string
          details: Json | null
          grid_class: string
          id: string
          image_url: string
          is_published: boolean
          name: string
          /** Legacy display string; dropped after rollout. Use price_myr. */
          price: string | null
          price_myr: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          aspect_class: string
          bg: string
          cloudinary_public_id?: string | null
          created_at?: string
          description_en: string
          description_ms: string
          details?: Json | null
          grid_class: string
          id: string
          image_url: string
          is_published?: boolean
          name: string
          price?: string | null
          price_myr: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          aspect_class?: string
          bg?: string
          cloudinary_public_id?: string | null
          created_at?: string
          description_en?: string
          description_ms?: string
          details?: Json | null
          grid_class?: string
          id?: string
          image_url?: string
          is_published?: boolean
          name?: string
          price?: string | null
          price_myr?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ready_stock_items: {
        Row: {
          cloudinary_public_id: string | null
          code: string
          created_at: string
          description_en: string | null
          description_ms: string | null
          id: string
          image_url: string
          name: string
          price_myr: number
          size_label: string | null
          sold_at: string | null
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          cloudinary_public_id?: string | null
          code?: string
          created_at?: string
          description_en?: string | null
          description_ms?: string | null
          id?: string
          image_url: string
          name: string
          price_myr: number
          size_label?: string | null
          sold_at?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          cloudinary_public_id?: string | null
          code?: string
          created_at?: string
          description_en?: string | null
          description_ms?: string | null
          id?: string
          image_url?: string
          name?: string
          price_myr?: number
          size_label?: string | null
          sold_at?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database['public']

export type Tables<
  TableName extends keyof DefaultSchema['Tables'],
> = DefaultSchema['Tables'][TableName]['Row']

export type TablesInsert<
  TableName extends keyof DefaultSchema['Tables'],
> = DefaultSchema['Tables'][TableName]['Insert']

export type TablesUpdate<
  TableName extends keyof DefaultSchema['Tables'],
> = DefaultSchema['Tables'][TableName]['Update']

/** snake_case row shape of public.products, used by the data layer and seed script. */
export type ProductRow = Database['public']['Tables']['products']['Row']
export type ProductSizeRow = Database['public']['Tables']['product_sizes']['Row']
export type ReadyStockRow = Database['public']['Tables']['ready_stock_items']['Row']

export type ReadyStockStatus = 'available' | 'sold'
