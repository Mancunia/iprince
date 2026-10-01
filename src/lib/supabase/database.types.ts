
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admins": {
                  Row: {
                    "created_at": string,"display_name": string,"id": string,"role": Database["public"]['Enums']["admin_role"],"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"display_name": string,"id"?: string,"role"?: Database["public"]['Enums']["admin_role"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"id"?: string,"role"?: Database["public"]['Enums']["admin_role"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"application_files": {
                  Row: {
                    "application_id": string,"created_at": string,"field_key": string,"id": string,"mime": string,"size": number,"storage_path": string,"updated_at": string
                  }
                  Insert: {
                    "application_id": string,"created_at"?: string,"field_key": string,"id"?: string,"mime": string,"size": number,"storage_path": string,"updated_at"?: string
                  }
                  Update: {
                    "application_id"?: string,"created_at"?: string,"field_key"?: string,"id"?: string,"mime"?: string,"size"?: number,"storage_path"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "application_files_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    }
                  ]
                },"applications": {
                  Row: {
                    "admin_notes": string,"answers": NonNullable<Json>,"created_at": string,"email": string,"form_id": string,"full_name": string,"id": string,"locale": string,"phone": string | null,"profession_id": string,"status": Database["public"]['Enums']["application_status"],"submitted_at": string | null,"updated_at": string
                  }
                  Insert: {
                    "admin_notes"?: string,"answers"?: NonNullable<Json>,"created_at"?: string,"email": string,"form_id": string,"full_name": string,"id"?: string,"locale": string,"phone"?: string | null,"profession_id": string,"status"?: Database["public"]['Enums']["application_status"],"submitted_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "admin_notes"?: string,"answers"?: NonNullable<Json>,"created_at"?: string,"email"?: string,"form_id"?: string,"full_name"?: string,"id"?: string,"locale"?: string,"phone"?: string | null,"profession_id"?: string,"status"?: Database["public"]['Enums']["application_status"],"submitted_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "applications_form_id_fkey"
      columns: ["form_id"]
isOneToOne: false
      referencedRelation: "profession_forms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "applications_profession_id_fkey"
      columns: ["profession_id"]
isOneToOne: false
      referencedRelation: "professions"
      referencedColumns: ["id"]
    }
                  ]
                },"blog_categories": {
                  Row: {
                    "created_at": string,"id": string,"name": NonNullable<Json>,"slug": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": NonNullable<Json>,"slug": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: NonNullable<Json>,"slug"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"blog_posts": {
                  Row: {
                    "author_name": string,"body": NonNullable<Json>,"category_id": string | null,"cover_path": string | null,"created_at": string,"excerpt": NonNullable<Json>,"id": string,"is_featured": boolean,"published_at": string | null,"slug": string,"status": Database["public"]['Enums']["post_status"],"title": NonNullable<Json>,"updated_at": string
                  }
                  Insert: {
                    "author_name"?: string,"body"?: NonNullable<Json>,"category_id"?: string | null,"cover_path"?: string | null,"created_at"?: string,"excerpt"?: NonNullable<Json>,"id"?: string,"is_featured"?: boolean,"published_at"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["post_status"],"title": NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "author_name"?: string,"body"?: NonNullable<Json>,"category_id"?: string | null,"cover_path"?: string | null,"created_at"?: string,"excerpt"?: NonNullable<Json>,"id"?: string,"is_featured"?: boolean,"published_at"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["post_status"],"title"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "blog_posts_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "blog_categories"
      referencedColumns: ["id"]
    }
                  ]
                },"contact_messages": {
                  Row: {
                    "created_at": string,"email": string,"id": string,"message": string,"name": string,"status": Database["public"]['Enums']["message_status"],"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"email": string,"id"?: string,"message": string,"name": string,"status"?: Database["public"]['Enums']["message_status"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"id"?: string,"message"?: string,"name"?: string,"status"?: Database["public"]['Enums']["message_status"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"employer_leads": {
                  Row: {
                    "admin_notes": string,"company": string,"contact_name": string,"created_at": string,"email": string,"headcount": number | null,"id": string,"message": string,"phone": string | null,"profession_ids": (string)[],"status": Database["public"]['Enums']["lead_status"],"updated_at": string
                  }
                  Insert: {
                    "admin_notes"?: string,"company": string,"contact_name": string,"created_at"?: string,"email": string,"headcount"?: number | null,"id"?: string,"message"?: string,"phone"?: string | null,"profession_ids"?: (string)[],"status"?: Database["public"]['Enums']["lead_status"],"updated_at"?: string
                  }
                  Update: {
                    "admin_notes"?: string,"company"?: string,"contact_name"?: string,"created_at"?: string,"email"?: string,"headcount"?: number | null,"id"?: string,"message"?: string,"phone"?: string | null,"profession_ids"?: (string)[],"status"?: Database["public"]['Enums']["lead_status"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profession_forms": {
                  Row: {
                    "created_at": string,"id": string,"profession_id": string,"published_at": string | null,"schema": NonNullable<Json>,"updated_at": string,"version": number
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"profession_id": string,"published_at"?: string | null,"schema": NonNullable<Json>,"updated_at"?: string,"version": number
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"profession_id"?: string,"published_at"?: string | null,"schema"?: NonNullable<Json>,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "profession_forms_profession_id_fkey"
      columns: ["profession_id"]
isOneToOne: false
      referencedRelation: "professions"
      referencedColumns: ["id"]
    }
                  ]
                },"professions": {
                  Row: {
                    "created_at": string,"current_form_id": string | null,"icon": string,"id": string,"is_active": boolean,"is_featured": boolean,"name": NonNullable<Json>,"open_positions": number,"slug": string,"sort_order": number,"summary": NonNullable<Json>,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"current_form_id"?: string | null,"icon"?: string,"id"?: string,"is_active"?: boolean,"is_featured"?: boolean,"name": NonNullable<Json>,"open_positions"?: number,"slug": string,"sort_order"?: number,"summary"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"current_form_id"?: string | null,"icon"?: string,"id"?: string,"is_active"?: boolean,"is_featured"?: boolean,"name"?: NonNullable<Json>,"open_positions"?: number,"slug"?: string,"sort_order"?: number,"summary"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "professions_current_form_fk"
      columns: ["current_form_id","id"]
isOneToOne: false
      referencedRelation: "profession_forms"
      referencedColumns: ["id","profession_id"]
    }
                  ]
                },"rate_limits": {
                  Row: {
                    "bucket": string,"count": number,"key": string,"window_start": string
                  }
                  Insert: {
                    "bucket": string,"count"?: number,"key": string,"window_start": string
                  }
                  Update: {
                    "bucket"?: string,"count"?: number,"key"?: string,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reviews": {
                  Row: {
                    "author_name": string,"body": NonNullable<Json>,"created_at": string,"id": string,"is_featured": boolean,"organisation": string | null,"profession_id": string | null,"rating": number,"role_title": NonNullable<Json>,"status": Database["public"]['Enums']["review_status"],"updated_at": string
                  }
                  Insert: {
                    "author_name": string,"body": NonNullable<Json>,"created_at"?: string,"id"?: string,"is_featured"?: boolean,"organisation"?: string | null,"profession_id"?: string | null,"rating": number,"role_title"?: NonNullable<Json>,"status"?: Database["public"]['Enums']["review_status"],"updated_at"?: string
                  }
                  Update: {
                    "author_name"?: string,"body"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"is_featured"?: boolean,"organisation"?: string | null,"profession_id"?: string | null,"rating"?: number,"role_title"?: NonNullable<Json>,"status"?: Database["public"]['Enums']["review_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_profession_id_fkey"
      columns: ["profession_id"]
isOneToOne: false
      referencedRelation: "professions"
      referencedColumns: ["id"]
    }
                  ]
                },"site_content": {
                  Row: {
                    "created_at": string,"id": string,"key": string,"updated_at": string,"updated_by": string | null,"value": NonNullable<Json>
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"key": string,"updated_at"?: string,"updated_by"?: string | null,"value": NonNullable<Json>
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"key"?: string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "delete_abandoned_applications":
{ Args: { "p_cutoff": string }; Returns: number
                           },
"finalize_application":
{ Args: { "p_application_id": string,"p_files": Json }; Returns: boolean
                           },
"hit_rate_limit":
{ Args: { "p_bucket": string,"p_key": string,"p_max": number,"p_window_seconds": number }; Returns: boolean
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_owner":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"orphaned_application_objects":
{ Args: { "p_cutoff": string,"p_limit": number }; Returns: string[]
                           },
"publish_form_draft":
{ Args: { "p_expected_updated_at": string,"p_form_id": string }; Returns: undefined
                           },
"start_form_draft":
{ Args: { "p_profession_id": string }; Returns: string
                           },
"storage_object_meta":
{ Args: { "p_bucket": string,"p_path": string }; Returns: Json
                           }
          }
          Enums: {
            "admin_role": "owner"|"editor","application_status": "new"|"reviewing"|"contacted"|"placed"|"rejected"|"archived","lead_status": "new"|"contacted"|"qualified"|"closed"|"archived","message_status": "new"|"read"|"archived","post_status": "draft"|"published","review_status": "pending"|"approved"|"rejected"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "admin_role": ["owner", "editor"],"application_status": ["new", "reviewing", "contacted", "placed", "rejected", "archived"],"lead_status": ["new", "contacted", "qualified", "closed", "archived"],"message_status": ["new", "read", "archived"],"post_status": ["draft", "published"],"review_status": ["pending", "approved", "rejected"]
          }
        }
} as const

