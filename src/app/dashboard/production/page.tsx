export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Factory, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ProductionPage() {
    const supabase = await createClient()

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Production Management</h2>
                    <p className="text-neutral-600">Manage production orders, weaving, and manufacturing</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/production/orders/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Production Order
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Active Orders</CardTitle>
                        <Factory className="h-4 w-4 text-neutral-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">0</div>
                        <p className="text-xs text-neutral-600 mt-1">In production</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Completed Today</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">0</div>
                        <p className="text-xs text-neutral-600 mt-1">Orders finished</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Efficiency</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">0%</div>
                        <p className="text-xs text-neutral-600 mt-1">Overall efficiency</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Pending Orders</CardTitle>
                        <Factory className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">0</div>
                        <p className="text-xs text-neutral-600 mt-1">Awaiting start</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/production/orders">
                        <CardHeader>
                            <CardTitle className="text-lg">Production Orders</CardTitle>
                            <CardDescription>View and manage all orders</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/production/weaving">
                        <CardHeader>
                            <CardTitle className="text-lg">Weaving Execution</CardTitle>
                            <CardDescription>Track weaving operations</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/production/machines">
                        <CardHeader>
                            <CardTitle className="text-lg">Machines & Looms</CardTitle>
                            <CardDescription>Equipment management</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/production/reports">
                        <CardHeader>
                            <CardTitle className="text-lg">Production Reports</CardTitle>
                            <CardDescription>Analytics and insights</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>
            </div>
        </div>
    )
}
