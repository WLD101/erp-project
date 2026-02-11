'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createInventoryMove(data: {
    itemId: string
    quantity: number
    sourceLocationId?: string
    destinationLocationId?: string
    moveType: string
    referenceType?: string
    referenceId?: string
    notes?: string
}) {
    const supabase = await createClient()

    // Get user's org_id
    const { data: { user } } = await supabase.auth.getUser()
    let orgId: string | null = null

    if (user) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('org_id')
            .eq('id', user.id)
            .single()

        orgId = profile?.org_id
    }

    if (!orgId) {
        return { success: false, error: 'Organization not found' }
    }

    // Call the RPC function
    const { data: result, error } = await supabase.rpc('create_inventory_move', {
        p_org_id: orgId,
        p_item_id: data.itemId,
        p_quantity: data.quantity,
        p_source_location_id: data.sourceLocationId || null,
        p_destination_location_id: data.destinationLocationId || null,
        p_move_type: data.moveType,
        p_reference_type: data.referenceType || null,
        p_reference_id: data.referenceId || null,
        p_notes: data.notes || null
    })

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/inventory')
    revalidatePath('/dashboard/inventory/moves')

    return result
}

export async function getLocationInventory(locationId?: string, itemId?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    let orgId: string | null = null

    if (user) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('org_id')
            .eq('id', user.id)
            .single()

        orgId = profile?.org_id
    }

    if (!orgId) {
        return { success: false, error: 'Organization not found', data: [] }
    }

    const { data, error } = await supabase.rpc('get_location_inventory', {
        p_org_id: orgId,
        p_location_id: locationId || null,
        p_item_id: itemId || null
    })

    if (error) {
        return { success: false, error: error.message, data: [] }
    }

    return { success: true, data }
}

export async function createLocation(data: {
    locationCode: string
    name: string
    locationType: string
    parentLocationId?: string
    address?: string
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    let orgId: string | null = null

    if (user) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('org_id')
            .eq('id', user.id)
            .single()

        orgId = profile?.org_id
    }

    if (!orgId) {
        return { success: false, error: 'Organization not found' }
    }

    const { error } = await supabase
        .from('locations')
        .insert({
            org_id: orgId,
            location_code: data.locationCode,
            name: data.name,
            location_type: data.locationType,
            parent_location_id: data.parentLocationId || null,
            address: data.address || null
        })

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/inventory/locations')

    return { success: true }
}

export async function seedDefaultLocations() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    let orgId: string | null = null

    if (user) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('org_id')
            .eq('id', user.id)
            .single()

        orgId = profile?.org_id
    }

    if (!orgId) {
        return { success: false, error: 'Organization not found' }
    }

    const { data, error } = await supabase.rpc('seed_default_locations', {
        p_org_id: orgId
    })

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/inventory/locations')

    return data
}
