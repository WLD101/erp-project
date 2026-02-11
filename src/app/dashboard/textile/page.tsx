export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, Package2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function TextilePage() {
    const supabase = await createClient()

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Textile Management</h2>
                    <p className="text-neutral-600">TNA calendar, orders, and buyer management</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/textile/orders/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Order
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Active Orders</CardTitle>
                        <Package2 className="h-4 w-4 text-neutral-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">0</div>
                        <p className="text-xs text-neutral-600 mt-1">In progress</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">TNA Tasks</CardTitle>
                        <Calendar className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">0</div>
                        <p className="text-xs text-neutral-600 mt-1">Due this week</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Delayed Tasks</CardTitle>
                        <Calendar className="h-4 w-4 text-rose-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">0</div>
                        <p className="text-xs text-neutral-600 mt-1">Overdue</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Active Buyers</CardTitle>
                        <Package2 className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">0</div>
                        <p className="text-xs text-neutral-600 mt-1">Total buyers</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/textile/tna">
                        <CardHeader>
                            <CardTitle className="text-lg">TNA Calendar</CardTitle>
                            <CardDescription>Time and Action calendar</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/textile/orders">
                        <CardHeader>
                            <CardTitle className="text-lg">Orders</CardTitle>
                            <CardDescription>Manage textile orders</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/textile/buyers">
                        <CardHeader>
                            <CardTitle className="text-lg">Buyers</CardTitle>
                            <CardDescription>Buyer management</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/textile/specifications">
                        <CardHeader>
                            <CardTitle className="text-lg">Specifications</CardTitle>
                            <CardDescription>Fabric specs and details</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>
            </div>
        </div>
    )
}
