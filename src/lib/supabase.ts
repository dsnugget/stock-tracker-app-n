import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      portfolios: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      portfolio_stocks: {
        Row: {
          id: string
          portfolio_id: string
          symbol: string
          quantity: number
          purchase_price: number
          purchase_date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          symbol: string
          quantity: number
          purchase_price: number
          purchase_date: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          symbol?: string
          quantity?: number
          purchase_price?: number
          purchase_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_watchlists: {
        Row: {
          id: string
          user_id: string
          symbols: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbols: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbols?: string[]
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
