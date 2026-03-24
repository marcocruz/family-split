export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    PostgrestVersion: "12"
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          phone: string | null
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          avatar_url?: string | null
          phone?: string | null
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          avatar_url?: string | null
          phone?: string | null
          currency?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          currency: string
          cover_emoji: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          currency?: string
          cover_emoji?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          currency?: string
          cover_emoji?: string | null
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'admin' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'admin' | 'member'
          joined_at?: string
        }
        Update: {
          role?: 'admin' | 'member'
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          emoji: string
          color: string
          is_default: boolean
          group_id: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          emoji?: string
          color?: string
          is_default?: boolean
          group_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          emoji?: string
          color?: string
        }
      }
      expenses: {
        Row: {
          id: string
          group_id: string
          category_id: string | null
          description: string
          amount: number
          currency: string
          paid_by: string
          split_type: 'equal' | 'exact' | 'percentage'
          date: string
          notes: string | null
          receipt_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          category_id?: string | null
          description: string
          amount: number
          currency?: string
          paid_by: string
          split_type?: 'equal' | 'exact' | 'percentage'
          date?: string
          notes?: string | null
          receipt_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          description?: string
          amount?: number
          currency?: string
          paid_by?: string
          split_type?: 'equal' | 'exact' | 'percentage'
          date?: string
          notes?: string | null
          updated_at?: string
        }
      }
      expense_splits: {
        Row: {
          id: string
          expense_id: string
          user_id: string
          amount: number
          is_paid: boolean
        }
        Insert: {
          id?: string
          expense_id: string
          user_id: string
          amount: number
          is_paid?: boolean
        }
        Update: {
          amount?: number
          is_paid?: boolean
        }
      }
      payments: {
        Row: {
          id: string
          group_id: string
          from_user: string
          to_user: string
          amount: number
          currency: string
          notes: string | null
          date: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          from_user: string
          to_user: string
          amount: number
          currency?: string
          notes?: string | null
          date?: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          notes?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Group = Database['public']['Tables']['groups']['Row']
export type GroupMember = Database['public']['Tables']['group_members']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseSplit = Database['public']['Tables']['expense_splits']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']

// Extended types with joined data
export interface ExpenseWithDetails extends Expense {
  categories: Category | null
  profiles: Profile | null
  expense_splits: (ExpenseSplit & { profiles: Profile | null })[]
}

export interface GroupWithMembers extends Group {
  group_members: (GroupMember & { profiles: Profile | null })[]
}

export interface Balance {
  userId: string
  userName: string
  amount: number // positive = owed to you, negative = you owe
}

export interface DebtEntry {
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  amount: number
}
