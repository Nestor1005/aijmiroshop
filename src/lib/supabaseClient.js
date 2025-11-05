import { createClient } from '@supabase/supabase-js'

// Prefer environment variables (Vite: VITE_*)
const url = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('aij-supabase-url') || ''
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('aij-supabase-anon') || ''

export const hasSupabaseConfig = () => Boolean(url && anon)

export const supabase = hasSupabaseConfig() ? createClient(url, anon, {
  auth: { persistSession: false },
}) : null
