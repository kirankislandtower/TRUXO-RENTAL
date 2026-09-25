import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { generateUniqueId, randomDigits } from '@/lib/ids';
import { splitContactRequest } from '@/lib/contactRequest';

const REQUEST_STATUSES = ['Pending', 'Approved', 'Rejected'];

export async function POST() {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('contact_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ requests: data });
  } catch (error: unknown) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const { id } = await request.json();

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { error } = await supabaseAdmin
      .from('contact_requests')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting request:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const { id, status } = await request.json();

    if (!REQUEST_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: requestData, error: fetchError } = await supabaseAdmin
      .from('contact_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Approving creates the client account. Do that BEFORE flipping the status
    // so a failed insert can't leave a request "Approved" with no client behind
    // it (and retrying the approval is safe: an existing client is reused).
    let clientId: string | null = null;
    let clientCreated = false;

    if (status === 'Approved') {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from('clients')
        .select('client_id')
        .eq('email', requestData.email)
        .limit(1);

      if (existingError) throw existingError;

      if (existing && existing.length > 0) {
        clientId = existing[0].client_id;
      } else {
        const clientName = `${requestData.first_name} ${requestData.last_name}`.trim();
        // The contact form keeps the phone inside `equipment_required`; there is
        // no separate phone_number column value for it.
        const phone = requestData.phone_number || splitContactRequest(requestData.equipment_required).phone || '';
        const newClientId = await generateUniqueId(supabaseAdmin, 'clients', 'client_id', () => `CL-${randomDigits(4)}`);

        const { error: insertError } = await supabaseAdmin.from('clients').insert({
          client_id: newClientId,
          name: clientName,
          contact: clientName,
          email: requestData.email,
          phone,
          active_rentals: 0,
          total_spent: 'AED 0',
          joined: new Date().toISOString(),
        });

        if (insertError) throw insertError;
        clientId = newClientId;
        clientCreated = true;
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from('contact_requests')
      .update({ status })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, client_id: clientId, client_created: clientCreated });
  } catch (error: unknown) {
    console.error('Error updating request:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
