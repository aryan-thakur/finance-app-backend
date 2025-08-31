import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  client: SupabaseClient;
  constructor() {
    const url = process.env.SUPABASE_URL!;
    // Prefer service role key; fall back to SUPABASE_KEY for local/dev
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    if (!url || !key) {
      throw new Error(
        'Missing Supabase configuration. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY) are set.'
      );
    }
    this.client = createClient(url, key);
  }
}
