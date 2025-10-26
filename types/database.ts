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
            workspaces: {
                Row: {
                    id: string
                    name: string
                    invite_code: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name?: string
                    invite_code: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    invite_code?: string
                    created_at?: string
                }
            }
            workspace_members: {
                Row: {
                    id: string
                    workspace_id: string
                    user_id: string
                    display_name: string | null
                    joined_at: string
                }
                Insert: {
                    id?: string
                    workspace_id: string
                    user_id: string
                    display_name?: string | null
                    joined_at?: string
                }
                Update: {
                    id?: string
                    workspace_id?: string
                    user_id?: string
                    display_name?: string | null
                    joined_at?: string
                }
            }
            categories: {
                Row: {
                    id: string
                    workspace_id: string
                    name: string
                    emoji: string | null
                    is_default: boolean
                    created_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    workspace_id: string
                    name: string
                    emoji?: string | null
                    is_default?: boolean
                    created_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    workspace_id?: string
                    name?: string
                    emoji?: string | null
                    is_default?: boolean
                    created_by?: string | null
                    created_at?: string
                }
            }
            expenses: {
                Row: {
                    id: string
                    workspace_id: string
                    category_id: string
                    amount: number
                    memo: string | null
                    spent_at: string
                    spent_by: string
                    recorded_by: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    workspace_id: string
                    category_id: string
                    amount: number
                    memo?: string | null
                    spent_at?: string
                    spent_by: string
                    recorded_by: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    workspace_id?: string
                    category_id?: string
                    amount?: number
                    memo?: string | null
                    spent_at?: string
                    spent_by?: string
                    recorded_by?: string
                    created_at?: string
                }
            }
        }
        Functions: {
            create_workspace_with_defaults: {
                Args: {
                    user_id: string
                }
                Returns: string
            }
        }
    }
}