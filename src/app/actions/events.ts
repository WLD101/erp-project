'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Process pending business events from the queue
 * This triggers cross-module automations (journal entries, inventory checks, etc.)
 */
export async function processBusinessEvents(orgId?: string) {
    const supabase = await createClient()

    try {
        // Call the database function to process events
        const { data, error } = await supabase.rpc('process_pending_events', {
            p_org_id: orgId || null,
            p_limit: 10
        })

        if (error) {
            console.error('Error processing events:', error)
            return {
                success: false,
                error: error.message,
                processed: 0,
                failed: 0
            }
        }

        return {
            success: true,
            processed: data?.processed || 0,
            failed: data?.failed || 0,
            total: data?.total || 0
        }
    } catch (error: any) {
        console.error('Exception processing events:', error)
        return {
            success: false,
            error: error.message,
            processed: 0,
            failed: 0
        }
    }
}

/**
 * Confirm a production order and trigger automations
 */
export async function confirmOrder(orderId: string) {
    const supabase = await createClient()

    try {
        // Get current user's org_id
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            // In mock mode, get org from order
            const { data: order } = await supabase
                .from('production_orders')
                .select('org_id')
                .eq('id', orderId)
                .single()

            if (!order) {
                return { success: false, error: 'Order not found' }
            }
        }

        // Update order status to 'confirmed'
        // This will trigger the database trigger automatically
        const { error: updateError } = await supabase
            .from('production_orders')
            .update({
                status: 'confirmed',
                confirmed_at: new Date().toISOString()
            })
            .eq('id', orderId)

        if (updateError) {
            return { success: false, error: updateError.message }
        }

        // Wait a moment for trigger to fire
        await new Promise(resolve => setTimeout(resolve, 500))

        // Process the events that were just created
        const result = await processBusinessEvents()

        // Revalidate relevant pages
        revalidatePath('/dashboard/production/orders')
        revalidatePath('/dashboard/finance/journals')
        revalidatePath('/dashboard/inventory')

        return {
            success: true,
            message: 'Order confirmed and automations triggered',
            automation: result
        }
    } catch (error: any) {
        console.error('Error confirming order:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Get recent business events for monitoring
 */
export async function getBusinessEvents(limit: number = 20) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('business_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching events:', error)
        return { success: false, error: error.message, events: [] }
    }

    return { success: true, events: data || [] }
}

/**
 * Retry a failed event
 */
export async function retryFailedEvent(eventId: string) {
    const supabase = await createClient()

    try {
        // Reset event status to pending
        const { error } = await supabase
            .from('business_events')
            .update({
                status: 'pending',
                error_message: null,
                processed_at: null
            })
            .eq('id', eventId)
            .eq('status', 'failed')

        if (error) {
            return { success: false, error: error.message }
        }

        // Process the event
        const result = await processBusinessEvents()

        return {
            success: true,
            message: 'Event retry initiated',
            result
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
