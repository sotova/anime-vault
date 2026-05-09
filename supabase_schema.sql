-- Create anime table
CREATE TABLE IF NOT EXISTS public.anime (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    synopsis TEXT,
    pv_url TEXT,
    image_url TEXT,
    season TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.anime ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read
CREATE POLICY "Allow public read access" ON public.anime
    FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert/update (optional, for admin)
CREATE POLICY "Allow authenticated insert" ON public.anime
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON public.anime
    FOR UPDATE USING (auth.role() = 'authenticated');
