import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const sanitizeEnv = (value?: string) =>
  value?.trim().replace(/^['"`]+|['"`]+$/g, "");

export function getSupabaseEnv() {
  const supabaseUrl = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseKey = sanitizeEnv(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  return { supabaseUrl, supabaseKey };
}

export const hasEnvVars = (() => {
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();
  return Boolean(supabaseUrl && supabaseKey);
})();
