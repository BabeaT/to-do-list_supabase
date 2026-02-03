import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "../utils";

export function createClient() {
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "缺少 Supabase 环境变量：请在 .env.local 中配置 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY，并重启开发服务器。",
    );
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
}
