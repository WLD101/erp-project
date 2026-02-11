import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

export function useTenantFeatures() {
    const [features, setFeatures] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const searchParams = useSearchParams()

    // We can get orgId from URL (super admin view) or context
    // For this prototype, we'll try to get it from URL or assume 'auth' context later
    const orgId = searchParams.get('orgId')

    useEffect(() => {
        const supabase = createClient()

        async function fetchFeatures() {
            if (!orgId) {
                // If no specific org view, maybe we are just super admin
                // Check if super admin
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                // If mocking super admin, return all
                if (process.env.NEXT_PUBLIC_MOCK_SUPER_ADMIN === 'true') {
                    setFeatures(['textile_manufacturing', 'payroll', 'multi_location'])
                    setLoading(false)
                    return
                }
                return
            }

            // Real fetch: Get plan features for this org
            // We join org_subs -> plan_features
            const { data, error } = await supabase
                .from('organization_subscriptions')
                .select('plan_id, subscription_plans(plan_features(feature_key))')
                .eq('org_id', orgId)
                .single()

            if (data && data.subscription_plans) {
                // Format: { subscription_plans: { plan_features: [{ feature_key: 'payroll' }, ...] } }
                // @ts-ignore
                const keys = data.subscription_plans.plan_features.map((f: any) => f.feature_key)
                setFeatures(keys)
            }
            setLoading(false)
        }

        fetchFeatures()
    }, [orgId])

    const hasFeature = (key: string) => features.includes(key) || process.env.NEXT_PUBLIC_MOCK_SUPER_ADMIN === 'true'

    return { features, hasFeature, loading }
}
