-- Anime Vault cloud catalogue schema.
-- Run this entire file in the Supabase SQL Editor. It is safe to rerun.
CREATE TABLE IF NOT EXISTS public.anime (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    synopsis TEXT NOT NULL DEFAULT '',
    pv_url TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    season TEXT NOT NULL DEFAULT '',
    total_episodes INTEGER NOT NULL DEFAULT 0,
    official_site TEXT NOT NULL DEFAULT '',
    copyright TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Upgrade installations made with an older version of the schema.
ALTER TABLE public.anime ADD COLUMN IF NOT EXISTS total_episodes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.anime ADD COLUMN IF NOT EXISTS official_site TEXT NOT NULL DEFAULT '';
ALTER TABLE public.anime ADD COLUMN IF NOT EXISTS copyright TEXT NOT NULL DEFAULT '';
ALTER TABLE public.anime ADD COLUMN IF NOT EXISTS pv_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.anime ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.anime ADD COLUMN IF NOT EXISTS season TEXT NOT NULL DEFAULT '';
ALTER TABLE public.anime ADD COLUMN IF NOT EXISTS synopsis TEXT NOT NULL DEFAULT '';
ALTER TABLE public.anime ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- This app intentionally uses an anon key and has no sign-in flow. The policies
-- below therefore permit catalogue CRUD from the deployed app.
ALTER TABLE public.anime ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.anime;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.anime;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.anime;
DROP POLICY IF EXISTS "Allow public read" ON public.anime;
DROP POLICY IF EXISTS "Allow public insert" ON public.anime;
DROP POLICY IF EXISTS "Allow public update" ON public.anime;
DROP POLICY IF EXISTS "Allow public delete" ON public.anime;
CREATE POLICY "Allow public read" ON public.anime FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.anime FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.anime FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.anime FOR DELETE USING (true);
