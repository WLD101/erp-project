'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateOrganizationSettings(settings: any) {
    const supabase = await createClient()

    // Get user's org_id
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user.id)
        .single()

    if (!profile?.org_id) {
        return { success: false, error: 'Organization not found' }
    }

    // Upsert settings
    const { error } = await supabase
        .from('organization_settings')
        .upsert({
            org_id: profile.org_id,
            ...settings,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'org_id'
        })

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/settings/organization')

    return { success: true }
}

export async function getOrganizationSettings() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user.id)
        .single()

    if (!profile?.org_id) {
        return null
    }

    const { data: settings } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('org_id', profile.org_id)
        .single()

    return settings
}

export async function applyTemplate(templateId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user.id)
        .single()

    if (!profile?.org_id) {
        return { success: false, error: 'Organization not found' }
    }

    const { data, error } = await supabase.rpc('apply_template_to_org', {
        p_org_id: profile.org_id,
        p_template_id: templateId
    })

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')

    return { success: true, ...data }
}
