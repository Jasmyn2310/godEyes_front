import { createClient } from '@supabase/supabase-js';

// TODO: Reemplazar con tus credenciales reales cuando tengas el backend de Supabase listo.
// Recuerda configurar esto usando variables de entorno (.env) en producción.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'tu-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
