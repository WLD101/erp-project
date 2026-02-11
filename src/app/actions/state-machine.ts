'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function transitionState(
    entityType: 'production_order' | 'invoice',
    entityId: string,
    toStatus: string
) {
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
    } else {
        // Mock mode - get org from entity
        const tableName = entityType === 'production_order' ? 'production_orders' : 'journal_entries'
        const { data: entity } = await supabase
            .from(tableName)
            .select('org_id')
            .eq('id', entityId)
            .single()

        orgId = entity?.org_id
    }

    if (!orgId) {
        return { success: false, error: 'Organization not found' }
    }

    // Call transition function
    const { data, error } = await supabase.rpc('transition_state', {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_org_id: orgId,
        p_to_status: toStatus
    })

    if (error) {
        return { success: false, error: error.message }
    }

    // Revalidate relevant paths
    if (entityType === 'production_order') {
        revalidatePath('/dashboard/production/orders')
    } else {
        revalidatePath('/dashboard/finance/journals')
    }

    return data
}

export async function getAvailableTransitions(
    entityType: 'production_order' | 'invoice',
    currentStatus: string
) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('state_transitions')
        .select('*')
        .eq('entity_type', entityType)
        .eq('from_status', currentStatus)

    if (error) {
        return { success: false, error: error.message, transitions: [] }
    }

    return { success: true, transitions: data }
}
