export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OrderConfirmButton } from '@/components/production/order-confirm-button'

export default async function ProductionOrdersPage() {
    const supabase = await createClient()

    // Fetch real production orders from database
    const { data: orders } = await supabase
        .from('production_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Production Orders</h2>
                    <p className="text-neutral-600">Manage manufacturing orders and trigger cross-module workflows</p>
                </div>
                <Link href="/dashboard/production/orders/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Order
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Production Orders</CardTitle>
                    <CardDescription>
                        Confirming an order automatically creates journal entries and checks inventory
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order #</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders && orders.length > 0 ? (
                                    orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-neutral-900">
                                                {order.order_number}
                                            </TableCell>
                                            <TableCell className="font-medium text-neutral-900">
                                                {order.product_id || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-neutral-700">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-neutral-900">
                                                {order.quantity || 0}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        order.status === 'confirmed' ? 'default' :
                                                            order.status === 'in_progress' ? 'default' :
                                                                'secondary'
                                                    }
                                                    className={
                                                        order.status === 'confirmed' ? 'bg-emerald-600' :
                                                            order.status === 'in_progress' ? 'bg-blue-600' :
                                                                'bg-amber-600'
                                                    }
                                                >
                                                    {order.status?.replace('_', ' ') || 'pending'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <OrderConfirmButton
                                                    orderId={order.id}
                                                    currentStatus={order.status || 'pending'}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-neutral-600">
                                            No production orders found. Create your first order to get started.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
