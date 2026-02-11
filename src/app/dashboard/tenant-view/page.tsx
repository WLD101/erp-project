'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Package, Settings, Users, Shield } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function ClientViewContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const orgId = searchParams.get('orgId')
    // const supabase = createClient() // Moved inside useEffect

    const [loading, setLoading] = useState(true)
    const [org, setOrg] = useState<any>(null)
    const [inventory, setInventory] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])

    useEffect(() => {
        if (!orgId) return

        async function fetchData() {
            const supabase = createClient()
            // 1. Fetch Org Details
            const { data: orgData } = await supabase.from('organizations').select('*').eq('id', orgId).single()
            setOrg(orgData)

            // 2. Fetch Inventory (RLS allows super_admin to see this now)
            const { data: invData } = await supabase.from('inventory').select('*').eq('org_id', orgId)
            if (invData) setInventory(invData)

            // 3. Fetch Users (Profiles)
            const { data: userData } = await supabase.from('profiles').select('*').eq('org_id', orgId)
            if (userData) setUsers(userData)

            setLoading(false)
        }
        fetchData()
    }, [orgId])

    if (!orgId) return <div className="p-8">Error: No Organization ID specified.</div>
    if (loading) return <div className="p-8">Loading Support Mode...</div>

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Bar (Impersonation Warning) */}
            <div className="bg-amber-600 px-6 py-2 text-white flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-semibold">SUPPORT MODE ACTIVE: Impersonating Tenant View</span>
                </div>
                <Button variant="ghost" size="sm" className="text-white hover:bg-amber-700" onClick={() => router.push('/dashboard')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Return to Control Tower
                </Button>
            </div>

            <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{org?.name}</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">ID: {org?.id}</Badge>
                            {org?.is_active ? <Badge className="bg-green-600">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}
                        </div>
                    </div>
                    <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Tenant Settings</Button>
                </div>

                <Tabs defaultValue="inventory" className="w-full">
                    <TabsList>
                        <TabsTrigger value="inventory"><Package className="mr-2 h-4 w-4" /> Inventory</TabsTrigger>
                        <TabsTrigger value="staff"><Users className="mr-2 h-4 w-4" /> Staff</TabsTrigger>
                    </TabsList>

                    <TabsContent value="inventory" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Current Stock</CardTitle>
                                <CardDescription>Real-time inventory levels.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {inventory.length === 0 ? (
                                    <p className="text-gray-500 italic">No inventory items found.</p>
                                ) : (
                                    <div className="rounded-md border">
                                        {inventory.map((item) => (
                                            <div key={item.id} className="flex justify-between p-4 border-b last:border-0 hover:bg-slate-50">
                                                <div>
                                                    <div className="font-medium">{item.item_name}</div>
                                                    <div className="text-sm text-gray-500">ID: {item.id}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-lg">{item.quantity}</div>
                                                    <div className="text-xs text-gray-400">UNITS</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="staff" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Staff Members</CardTitle>
                                <CardDescription>Users with access to this tenant.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {users.length === 0 ? (
                                    <p className="text-gray-500 italic">No users found.</p>
                                ) : (
                                    <ul className="space-y-4">
                                        {users.map((u) => (
                                            <li key={u.id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-100 p-2 rounded-full">
                                                        <Users className="h-4 w-4 text-blue-700" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">User {u.id.substring(0, 8)}...</div>
                                                        <div className="text-sm text-gray-500 capitalize">{u.role}</div>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm">Manage</Button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

export const dynamic = 'force-dynamic'

export default function ClientViewPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ClientViewContent />
        </Suspense>
    )
}
