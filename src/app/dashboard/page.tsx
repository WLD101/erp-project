'use client'

// Force dynamic rendering - this page requires runtime data from Supabase
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { TenantList } from '@/components/dashboard/tenant-list'
import { TenantDashboard } from '@/components/dashboard/tenant-dashboard'

export default function DashboardOrchestrator() {
    const [role, setRole] = useState<string | null>(null)
    const [mockMode, setMockMode] = useState(false)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function init() {
            const isMock = process.env.NEXT_PUBLIC_MOCK_SUPER_ADMIN === 'true'
            setMockMode(isMock)

            if (isMock) {
                setRole('super_admin')
                setLoading(false)
            } else {
                // Get actual user role from database
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: profile } = await supabase
                        .from('user_profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single()

                    setRole(profile?.role || 'staff')
                }
                setLoading(false)
            }
        }
        init()
    }, [])

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Initializing...</div>
    }

    // Super Admin sees Control Tower
    if (role === 'super_admin') return <SuperAdminControlTower />

    // Regular users (admin, staff, viewer) see Tenant Dashboard
    return <TenantDashboard />
}

function SuperAdminControlTower() {
    const [health, setHealth] = useState<any>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const supabase = createClient()

    const refreshHealth = async () => {
        const { data } = await supabase.rpc('fn_generate_system_health_report')
        if (data) setHealth(data)
        setRefreshTrigger(prev => prev + 1)
    }

    useEffect(() => {
        refreshHealth()
    }, [])

    return (
        <div className="space-y-6">
            {/* Quick Actions Bar */}
            <div className="flex justify-end p-2 md:p-0">
                <AddOrgModal onSuccess={refreshHealth} />
            </div>

            {/* Stats Overview */}
            <StatsCards health={health} />

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <TenantList onSuccess={refreshHealth} />
            </div>
        </div>
    )
}

function AddOrgModal({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [plan, setPlan] = useState('starter')
    const [fbrEnabled, setFbrEnabled] = useState(false)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleCreate = async () => {
        setLoading(true)
        const fakeUserId = crypto.randomUUID()
        const { data: orgId, error } = await supabase.rpc('signup_new_tenant', {
            org_name: name,
            user_id: fakeUserId,
            user_email: email,
            plan_id: plan
        })

        if (!error && fbrEnabled && orgId) {
            // If FBR is enabled manually, call the helper
            await supabase.rpc('enable_adhoc_feature', {
                target_org_id: orgId,
                feature: 'fbr_integration'
            })
        }

        if (!error) {
            onSuccess()
            setOpen(false)
            setName('')
            setEmail('')
        } else {
            alert('Error: ' + error.message)
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
                <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
                    <Plus className="mr-2 h-4 w-4" /> Onboard Tenant
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Provision New Infrastructure</DialogTitle>
                    <DialogDescription>
                        Create a dedicated schema and organization container.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Organization Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Logistics" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Admin Email (simulated)</Label>
                        <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@acme.com" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="plan">Subscription Plan</Label>
                        <select
                            id="plan"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={plan}
                            onChange={(e) => setPlan(e.target.value)}
                        >
                            <option value="starter">Starter (Max 2 Users)</option>
                            <option value="premium">Premium (Max 10 Users)</option>
                            <option value="enterprise">Enterprise (Unlimited + Textile)</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-2 border p-3 rounded-md">
                        <input
                            type="checkbox"
                            id="fbr"
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                            checked={fbrEnabled}
                            onChange={(e) => setFbrEnabled(e.target.checked)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="fbr" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Enable FBR E-Invoicing
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Add-on for Tier-1 Tax Compliance
                            </p>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate} disabled={loading} className="w-full bg-indigo-600">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Provision Tenant
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
