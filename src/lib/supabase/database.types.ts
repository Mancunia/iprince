export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface SiteContentRow {
  id: string;
  key: string;
  content: Record<string, any>;
  updated_at: string;
  updated_by: string | null;
}

export interface CategoryRow {
  id: string;
  slug: string;
  name_de: string;
  name_en: string;
  description_de: string | null;
  description_en: string | null;
  color_badge: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface BlogRow {
  id: string;
  slug: string;
  title_de: string;
  title_en: string;
  excerpt_de: string | null;
  excerpt_en: string | null;
  content_de: string;
  content_en: string;
  category_id: string | null;
  featured_image: string | null;
  author_name: string;
  author_role: string;
  author_avatar: string | null;
  read_time_minutes: number;
  language: string;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  views: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FormSubmissionRow {
  id: string;
  form_type: 'candidate_cv' | 'employer_request' | 'contact_inquiry';
  status: 'new' | 'under_review' | 'contacted' | 'completed' | 'archived';
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  profession: string | null;
  language_level: string | null;
  experience_years: string | null;
  notes: string | null;
  resume_url: string | null;
  form_payload: Record<string, any>;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewRow {
  id: string;
  author_name: string;
  role_title: string;
  clinic_name: string | null;
  author_avatar: string | null;
  rating: number;
  review_text_de: string;
  review_text_en: string | null;
  verified: boolean;
  is_featured: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      site_content: {
        Row: SiteContentRow;
        Insert: Omit<SiteContentRow, 'id' | 'updated_at'> & { id?: string; updated_at?: string };
        Update: Partial<Omit<SiteContentRow, 'id'>>;
        Relationships: [];
      };
      categories: {
        Row: CategoryRow;
        Insert: Omit<CategoryRow, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<CategoryRow, 'id'>>;
        Relationships: [];
      };
      blogs: {
        Row: BlogRow;
        Insert: Omit<BlogRow, 'id' | 'views' | 'created_at' | 'updated_at'> & { id?: string; views?: number; created_at?: string; updated_at?: string };
        Update: Partial<Omit<BlogRow, 'id'>>;
        Relationships: [
          {
            foreignKeyName: "blogs_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      form_submissions: {
        Row: FormSubmissionRow;
        Insert: Omit<FormSubmissionRow, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<FormSubmissionRow, 'id'>>;
        Relationships: [];
      };
      reviews: {
        Row: ReviewRow;
        Insert: Omit<ReviewRow, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<ReviewRow, 'id'>>;
        Relationships: [];
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Relationships: unknown[];
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      [key: string]: string;
    };
    CompositeTypes: {
      [key: string]: unknown;
    };
  };
};
