import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const RETURN_LOCATION = 'Main Depot';

// The public fleet page and the sitemap are cached; call this after any change to the fleet table
// so visitors and search engines see it right away instead of after the cache expires.
function refreshPublicFleetPages() {
  revalidatePath('/fleet');
  revalidatePath('/sitemap.xml');
}

// Placeholder contract value credited to a client each time an asset is assigned.
const SIMULATED_CONTRACT_VALUE = 50000;

// total_spent is stored as a display string ("AED 50,000", "AED 1.2M").
function addToTotalSpent(current: string | null | undefined, amount: number): string {
  let numericVal = 0;
  if (current) {
    const currentVal = current.replace('AED ', '').trim();
    if (currentVal.endsWith('M')) {
      numericVal = parseFloat(currentVal) * 1000000;
    } else if (currentVal.endsWith('K')) {
      numericVal = parseFloat(currentVal) * 1000;
    } else {
      numericVal = parseInt(currentVal.replace(/,/g, '')) || 0;
    }
  }
  numericVal += amount;
  if (numericVal >= 1000000) {
    return `AED ${(numericVal / 1000000).toFixed(1)}M`;
  }
  return `AED ${numericVal.toLocaleString()}`;
}

// A client "holds" one active rental per Deployed asset. Call this whenever an
// asset leaves the Deployed state (returned, sent to maintenance, or deleted).
async function releaseClientRental(supabase: SupabaseClient, clientId: string) {
  const { data: clientData, error: fetchError } = await supabase
    .from('clients')
    .select('active_rentals')
    .eq('client_id', clientId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!clientData) return;

  const { error: updateError } = await supabase
    .from('clients')
    .update({ active_rentals: Math.max(0, (clientData.active_rentals || 0) - 1) })
    .eq('client_id', clientId);
  if (updateError) throw updateError;
}

export async function POST() {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('fleet')
      .select('*')
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

export async function PATCH(request: Request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const { action, old_asset_id, asset_id, type, model, image, daily_rent, hourly_rate, client_id, location, new_status } = await request.json();

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // ── Edit asset details ───────────────────────────────────────────────────
    if (action === 'edit_details') {
      if (!old_asset_id) {
        return NextResponse.json({ error: 'old_asset_id is required' }, { status: 400 });
      }
      const { error: updateError } = await supabaseAdmin
        .from('fleet')
        .update({
          asset_id,
          type,
          model,
          image,
          daily_rent: parseInt(daily_rent) || 1200,
          hourly_rate: parseInt(hourly_rate) || 350
        })
        .eq('asset_id', old_asset_id);

      if (updateError) throw updateError;
      refreshPublicFleetPages();
      return NextResponse.json({ success: true });
    }

    // Every remaining action depends on what the asset is doing right now.
    if (!asset_id) {
      return NextResponse.json({ error: 'asset_id is required' }, { status: 400 });
    }

    const { data: asset, error: assetError } = await supabaseAdmin
      .from('fleet')
      .select('status, client_id')
      .eq('asset_id', asset_id)
      .maybeSingle();
    if (assetError) throw assetError;
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // ── Status change: Available / Maintenance ──────────────────────────────
    // Moving an asset OUT of Deployed (a return, or straight to maintenance)
    // releases it from its client: clear client_id, send it back to the depot
    // and decrement the client's active_rentals.
    if (new_status === 'Available' || new_status === 'Maintenance') {
      const wasDeployed = asset.status === 'Deployed';
      const update: Record<string, unknown> = { status: new_status };
      if (wasDeployed || new_status === 'Available') {
        update.client_id = null;
        update.location = RETURN_LOCATION;
      }

      const { error: fleetError } = await supabaseAdmin
        .from('fleet')
        .update(update)
        .eq('asset_id', asset_id);
      if (fleetError) throw fleetError;

      if (wasDeployed && asset.client_id) {
        await releaseClientRental(supabaseAdmin, asset.client_id);
      }
      refreshPublicFleetPages();
      return NextResponse.json({ success: true });
    }

    // ── Assign asset to a client (→ Deployed) ────────────────────────────────
    if ((new_status === undefined || new_status === 'Deployed') && typeof client_id === 'string' && client_id) {
      if (asset.status !== 'Available') {
        return NextResponse.json(
          { error: `Asset is ${asset.status}. Only Available assets can be assigned.` },
          { status: 409 },
        );
      }

      const { data: clientData, error: clientFetchError } = await supabaseAdmin
        .from('clients')
        .select('active_rentals, total_spent')
        .eq('client_id', client_id)
        .maybeSingle();
      if (clientFetchError) throw clientFetchError;
      if (!clientData) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }

      const { error: fleetError } = await supabaseAdmin
        .from('fleet')
        .update({
          status: 'Deployed',
          client_id,
          location: location || 'Client Job Site'
        })
        .eq('asset_id', asset_id);
      if (fleetError) throw fleetError;

      const { error: clientUpdateError } = await supabaseAdmin
        .from('clients')
        .update({
          active_rentals: (clientData.active_rentals || 0) + 1,
          total_spent: addToTotalSpent(clientData.total_spent, SIMULATED_CONTRACT_VALUE)
        })
        .eq('client_id', client_id);
      if (clientUpdateError) throw clientUpdateError;

      refreshPublicFleetPages();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error updating asset:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const { asset_id, type, model, image, location, hours, daily_rent, hourly_rate } = await request.json();

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { error: insertError } = await supabaseAdmin
      .from('fleet')
      .insert({
        asset_id,
        type,
        model,
        image,
        location: location || 'Main Depot',
        hours: parseInt(hours) || 0,
        status: 'Available',
        daily_rent: parseInt(daily_rent) || 1200,
        hourly_rate: parseInt(hourly_rate) || 350
      });

    if (insertError) throw insertError;

    refreshPublicFleetPages();
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error adding asset:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const { asset_id } = await request.json();

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Deleting a Deployed asset must also release the client's rental count.
    const { data: asset, error: assetError } = await supabaseAdmin
      .from('fleet')
      .select('status, client_id')
      .eq('asset_id', asset_id)
      .maybeSingle();
    if (assetError) throw assetError;

    const { error: deleteError } = await supabaseAdmin
      .from('fleet')
      .delete()
      .eq('asset_id', asset_id);

    if (deleteError) throw deleteError;

    if (asset?.status === 'Deployed' && asset.client_id) {
      await releaseClientRental(supabaseAdmin, asset.client_id);
    }

    refreshPublicFleetPages();
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
