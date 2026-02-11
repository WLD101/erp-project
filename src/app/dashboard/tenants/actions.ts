'use server';

import { createClient } from '@/lib/supabase/server';

export interface Tenant {
    id: string;
    name: string;
    created_at: string;
    subscription: {
        plan_id: string;
        status: string;
    } | null;
    user_count: number;
}

export async function getTenants(): Promise<{ tenants: Tenant[], error?: string }> {
    const supabase = await createClient();

    try {
        // 1. Fetch Organizations
        const { data: orgs, error } = await supabase
            .from('organizations')
            .select('id, name, created_at, organization_subscriptions(plan_id, status)');

        if (error) throw error;

        // 2. Fetch User Counts (Separate query or RPC would be better for perf, but loops for now)
        const tenants: Tenant[] = [];

        for (const org of orgs) {
            const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('org_id', org.id);

            tenants.push({
                id: org.id,
                name: org.name,
                created_at: org.created_at,
                subscription: org.organization_subscriptions?.[0] || null, // generic type issue fix
                user_count: count || 0
            });
        }

        return { tenants };
    } catch (err: any) {
        return { tenants: [], error: err.message };
    }
}
