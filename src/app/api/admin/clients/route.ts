import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { generateUniqueId, randomDigits } from '@/lib/ids';

export async function POST() {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .order('joined', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ clients: data });
  } catch (error: unknown) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const { name, contact, email, phone } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const clientId = await generateUniqueId(supabaseAdmin, 'clients', 'client_id', () => `CL-${randomDigits(4)}`);

    const { error } = await supabaseAdmin.from('clients').insert({
      client_id: clientId,
      name,
      contact: contact || name,
      email,
      phone: phone || '',
      active_rentals: 0,
      total_spent: 'AED 0',
      joined: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ success: true, client_id: clientId });
  } catch (error: unknown) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
