-- ============================================================
-- Migration 005: hero_gallery table + storage bucket
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── Storage bucket (public) ───────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery',
  'gallery',
  true,
  524288000,  -- 500 MB per file
  ARRAY['image/gif','image/webp','image/png','image/jpeg','image/avif','video/mp4','video/webm','video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Allow service role (used by server actions) to manage files
DROP POLICY IF EXISTS "service role full access" ON storage.objects;
CREATE POLICY "service role full access"
  ON storage.objects FOR ALL
  USING (bucket_id = 'gallery')
  WITH CHECK (bucket_id = 'gallery');

CREATE TABLE IF NOT EXISTS hero_gallery (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT,
  file_url   TEXT        NOT NULL,
  file_type  TEXT        NOT NULL DEFAULT 'gif',
  sort_order INT         NOT NULL DEFAULT 0,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hero_gallery_active_order_idx
  ON hero_gallery(is_active, sort_order ASC);

ALTER TABLE hero_gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can read active gallery" ON hero_gallery;
CREATE POLICY "public can read active gallery"
  ON hero_gallery FOR SELECT
  USING (is_active = true);
