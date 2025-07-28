export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'customer'
          location: 'Udaipur' | 'Mungana' | null
          phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role: 'admin' | 'customer'
          location?: 'Udaipur' | 'Pratapgarh' | null
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'customer'
          location?: 'Udaipur' | 'Pratapgarh' | null
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          image_url: string
          company: string
          category: string
          variations: Json
          locations: ('Udaipur' | 'Mungana')[]
          discount: Json | null
          is_trending: boolean | null
          trending_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          image_url: string
          company: string
          category: string
          variations: Json
          locations: ('Udaipur' | 'Mungana')[]
          discount?: Json | null
          is_trending?: boolean | null
          trending_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          image_url?: string
          company?: string
          category?: string
          variations?: Json
          locations?: ('Udaipur' | 'Pratapgarh')[]
          discount?: Json | null
          is_trending?: boolean | null
          trending_order?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          total_amount: number
          location: 'Udaipur' | 'Mungana'
          status: 'pending' | 'completed' | 'cancelled'
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_amount: number
          location: 'Udaipur' | 'Mungana'
          status?: 'pending' | 'completed' | 'cancelled'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_amount?: number
          location?: 'Udaipur' | 'Pratapgarh'
          status?: 'pending' | 'completed' | 'cancelled'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          variation_id: string
          quantity: number
          price: number
          original_price: number | null
          discount_applied: Json | null
          product_snapshot: Json | null
          variation_snapshot: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          variation_id: string
          quantity: number
          price: number
          original_price?: number | null
          discount_applied?: Json | null
          product_snapshot?: Json | null
          variation_snapshot?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          variation_id?: string
          quantity?: number
          price?: number
          original_price?: number | null
          discount_applied?: Json | null
          product_snapshot?: Json | null
          variation_snapshot?: Json | null
          created_at?: string
        }
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