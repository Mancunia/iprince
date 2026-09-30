-- ==============================================================================
-- iPrince Recruiting / iPrince Personalvermittlung
-- Migration: Admin CMS, Categories, Blogs, Form Submissions, and Reviews
-- ==============================================================================

-- 1. Site Content & Settings Table
CREATE TABLE IF NOT EXISTS public.site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT
);

-- 2. Blog Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_de TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_de TEXT,
  description_en TEXT,
  color_badge TEXT DEFAULT '#D4AF37', -- Gold accent default
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Blog Posts Table
CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_de TEXT NOT NULL,
  title_en TEXT NOT NULL,
  excerpt_de TEXT,
  excerpt_en TEXT,
  content_de TEXT NOT NULL,
  content_en TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  featured_image TEXT,
  author_name TEXT DEFAULT 'iPrince Editorial',
  author_role TEXT DEFAULT 'Healthcare Career Specialist',
  author_avatar TEXT,
  read_time_minutes INT DEFAULT 4,
  language TEXT DEFAULT 'both', -- 'de', 'en', 'both'
  status TEXT DEFAULT 'draft',   -- 'draft', 'published', 'archived'
  is_featured BOOLEAN DEFAULT false,
  views INT DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Customer Form Submissions Table
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type TEXT NOT NULL, -- 'candidate_cv', 'employer_request', 'contact_inquiry'
  status TEXT DEFAULT 'new', -- 'new', 'under_review', 'contacted', 'completed', 'archived'
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT, -- For employer requests
  profession TEXT,   -- e.g. 'Intensivpflege', 'OP-Pflege', 'Allgemeine Pflege'
  language_level TEXT, -- e.g. 'A2', 'B1', 'B2 Telc/Goethe', 'C1'
  experience_years TEXT,
  notes TEXT,
  resume_url TEXT,
  form_payload JSONB DEFAULT '{}'::jsonb, -- dynamic extra fields
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Customer Reviews & Testimonials Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  role_title TEXT NOT NULL, -- e.g. 'Pflegefachkraft (ITS)', 'Pflegedienstleitung'
  clinic_name TEXT,         -- e.g. 'Universitätsklinikum Düsseldorf'
  author_avatar TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text_de TEXT NOT NULL,
  review_text_en TEXT,
  verified BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blogs_category ON public.blogs(category_id);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON public.blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON public.blogs(slug);
CREATE INDEX IF NOT EXISTS idx_submissions_type ON public.form_submissions(form_type);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read site_content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read published blogs" ON public.blogs FOR SELECT USING (status = 'published');
CREATE POLICY "Public read approved reviews" ON public.reviews FOR SELECT USING (status = 'approved');

-- Public insert policies for submissions and reviews
CREATE POLICY "Public insert form_submissions" ON public.form_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- Authenticated (Admin) full access policies
CREATE POLICY "Admin full access site_content" ON public.site_content FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access categories" ON public.categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access blogs" ON public.blogs FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access form_submissions" ON public.form_submissions FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access reviews" ON public.reviews FOR ALL TO authenticated USING (true);
