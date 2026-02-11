export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Package, TrendingDown, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function InventoryPage() {
    const supabase = await createClient()

    // Get quick stats
    const { data: itemCount } = await supabase
        .from('inventory')
        .select('id', { count: 'exact', head: true })

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Inventory Management</h2>
                    <p className="text-neutral-600">Manage stock levels, items, and transactions</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/inventory/items/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Item
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Total Items</CardTitle>
                        <Package className="h-4 w-4 text-neutral-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">{itemCount?.count || 0}</div>
                        <p className="text-xs text-neutral-600 mt-1">In inventory</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Low Stock Items</CardTitle>
                        <TrendingDown className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">0</div>
                        <p className="text-xs text-neutral-600 mt-1">Need reorder</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Out of Stock</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">0</div>
                        <p className="text-xs text-neutral-600 mt-1">Urgent attention</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Total Value</CardTitle>
                        <Package className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">PKR 0</div>
                        <p className="text-xs text-neutral-600 mt-1">Stock valuation</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/inventory/items">
                        <CardHeader>
                            <CardTitle className="text-lg">Item Master</CardTitle>
                            <CardDescription>View and manage all inventory items</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/inventory/stock">
                        <CardHeader>
                            <CardTitle className="text-lg">Stock Levels</CardTitle>
                            <CardDescription>Current stock quantities</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/inventory/transactions">
                        <CardHeader>
                            <CardTitle className="text-lg">Transactions</CardTitle>
                            <CardDescription>Stock in/out history</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/inventory/stock-in">
                        <CardHeader>
                            <CardTitle className="text-lg">Stock In</CardTitle>
                            <CardDescription>Record incoming stock</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/inventory/stock-out">
                        <CardHeader>
                            <CardTitle className="text-lg">Stock Out</CardTitle>
                            <CardDescription>Record outgoing stock</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/inventory/reports">
                        <CardHeader>
                            <CardTitle className="text-lg">Reports</CardTitle>
                            <CardDescription>Stock reports and analytics</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>
            </div>
        </div>
    )
}
