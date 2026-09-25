import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Public endpoint: only ever expose what the website needs to render. It uses
// the service-role client, so `select('*')` here would leak internal columns
// (client_id, rates, engine hours) to anyone who calls it.
const PUBLIC_FLEET_COLUMNS = 'asset_id, type, model, image, location, status';

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('fleet')
      .select(PUBLIC_FLEET_COLUMNS)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ fleet: data });
  } catch (error: unknown) {
    console.error('Error fetching fleet:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
