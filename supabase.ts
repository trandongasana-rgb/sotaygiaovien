import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lvxwjsohoimhbgwiiytu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2eHdqc29ob2ltaGJnd2lpeXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNzkyMzgsImV4cCI6MjA5MTY1NTIzOH0.QSyWu9_IQNG-Vpy_CJu1KmHa4zBxBPSJv2WzqGSX9WE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
