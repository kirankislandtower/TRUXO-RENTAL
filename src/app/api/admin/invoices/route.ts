import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { generateUniqueId, randomDigits } from '@/lib/ids';

const INVOICE_STATUSES = ['Paid', 'Pending', 'Overdue', 'Draft'];

// FETCH ALL INVOICES
export async function POST() {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .order('issued', { ascending: false });

    if (error) {
      // If table doesn't exist, just return empty array instead of crashing UI
      if (error.code === '42P01') {
        return NextResponse.json({ invoices: [] });
      }
      throw error;
    }

    return NextResponse.json({ invoices: data });
  } catch (error: unknown) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

// CREATE INVOICE
export async function PUT(request: Request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const { client_name, client_id, equipment, amount, issued, due, items } = await request.json();

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Auto-generate a collision-free invoice ID
    const year = new Date().getFullYear();
    const invoiceId = await generateUniqueId(supabaseAdmin, 'invoices', 'id', () => `INV-${year}-${randomDigits(4)}`);

    const { error } = await supabaseAdmin.from('invoices').insert({
      id: invoiceId,
      client: client_name,
      client_id,
      equipment,
      amount,
      issued: issued || new Date().toISOString(),
      due: due || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Pending',
      items: items || []
    });

    if (error) throw error;

    return NextResponse.json({ success: true, id: invoiceId });
  } catch (error: unknown) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

// UPDATE INVOICE STATUS
export async function PATCH(request: Request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const { id, status } = await request.json();

    if (!id || !INVOICE_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid invoice id or status' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { error } = await supabaseAdmin
      .from('invoices')
      .update({ status })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
