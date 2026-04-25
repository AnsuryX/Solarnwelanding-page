-- Leads table for Solargear Kenya
-- Run this in the Supabase SQL Editor

-- IMPORTANT: In Make.com, always connect to the 'leads' TABLE.
-- DO NOT connect your Insert module to 'recent_leads' (it's a view and not updatable).

-- 1. Create the leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    full_name TEXT,     -- Removed NOT NULL for easier initial testing
    phone TEXT,         -- Removed NOT NULL for easier initial testing
    email TEXT,
    location TEXT,
    monthly_bill TEXT,
    source TEXT,        -- e.g., 'whatsapp_modal' or 'quote_form'
    context TEXT,       -- e.g., 'SolarStart™ Backup'
    status TEXT DEFAULT 'new',
    notes TEXT
);

-- 2. Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow inserting data
-- If using Make.com with a SERVICE ROLE KEY, you don't even need this policy, 
-- but this allows 'anon' access if you want to hit the API without a key (less secure).
CREATE POLICY "Allow anonymous inserts" 
ON public.leads 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- 4. Create a policy for you to view your leads
CREATE POLICY "Allow lead viewing for authenticated users" 
ON public.leads 
FOR SELECT 
TO authenticated 
USING (true);

-- 5. Helpful view for the Nairobi Sales Team
-- WARNING: This view is READ-ONLY. Inserting into this will cause a 500 error in Make.com.
DROP VIEW IF EXISTS recent_leads;
CREATE VIEW recent_leads AS
SELECT * FROM leads
ORDER BY created_at DESC;
