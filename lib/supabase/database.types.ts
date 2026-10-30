export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          aspect_class: string
          bg: string
          created_at: string
          description_en: string
          description_ms: string
          grid_class: string
          id: string
          image_url: string
          name: string
          price: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          aspect_class: string
          bg: string
          created_at?: string
          description_en: string
          description_ms: string
          grid_class: string
          id: string
          image_url: string
          name: string
          price: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          aspect_class?: string
          bg?: string
          created_at?: string
          description_en?: string
          description_ms?: string
          grid_class?: string
          id?: string
          image_url?: string
          name?: string
          price?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
