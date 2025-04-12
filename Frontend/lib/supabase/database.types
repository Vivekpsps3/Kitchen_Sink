export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string | null
          cook_time: string | null
          servings: number | null
          difficulty: "Beginner" | "Intermediate" | "Advanced" | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url?: string | null
          cook_time?: string | null
          servings?: number | null
          difficulty?: "Beginner" | "Intermediate" | "Advanced" | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          cook_time?: string | null
          servings?: number | null
          difficulty?: "Beginner" | "Intermediate" | "Advanced" | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      ingredients: {
        Row: {
          id: string
          recipe_id: string
          name: string
          amount: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          name: string
          amount?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          name?: string
          amount?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      instructions: {
        Row: {
          id: string
          recipe_id: string
          step_number: number
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          step_number: number
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          step_number?: number
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      recipe_tags: {
        Row: {
          recipe_id: string
          tag_id: string
        }
        Insert: {
          recipe_id: string
          tag_id: string
        }
        Update: {
          recipe_id?: string
          tag_id?: string
        }
      }
      comments: {
        Row: {
          id: string
          recipe_id: string
          user_id: string
          content: string
          rating: number | null
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          user_id: string
          content: string
          rating?: number | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          user_id?: string
          content?: string
          rating?: number | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comment_votes: {
        Row: {
          comment_id: string
          user_id: string
          vote_type: "upvote" | "downvote"
        }
        Insert: {
          comment_id: string
          user_id: string
          vote_type: "upvote" | "downvote"
        }
        Update: {
          comment_id?: string
          user_id?: string
          vote_type?: "upvote" | "downvote"
        }
      }
      featured_recipes: {
        Row: {
          id: string
          recipe_id: string
          featured_date: string
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          featured_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          featured_date?: string
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
  }
}
