import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rpfdngcgidrcnpcowogl.supabase.co";
const supabasePublishableKey = "sb_publishable_cK7BHnFQgw3-UwBHNxieLQ_KPl1P-te";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
