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

export default async function TextileOrdersPage() {
    const supabase = await createClient()

    // Sample textile orders
    const orders = [
        { id: '1', order_no: 'TO-001', buyer: 'ABC Textiles', style: 'ST-100', quantity: 5000, delivery: '2024-03-15', status: 'in_progress' },
        { id: '2', order_no: 'TO-002', buyer: 'XYZ Garments', style: 'ST-200', quantity: 3000, delivery: '2024-03-20', status: 'pending' },
    ]

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Textile Orders</h2>
                    <p className="text-neutral-600">Manage buyer orders and production schedules</p>
                </div>
                <Link href="/dashboard/textile/orders/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Order
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Orders</CardTitle>
                    <CardDescription>Buyer orders and delivery schedules</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order #</TableHead>
                                    <TableHead>Buyer</TableHead>
                                    <TableHead>Style</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead>Delivery Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-neutral-900">{order.order_no}</TableCell>
                                        <TableCell className="font-medium text-neutral-900">{order.buyer}</TableCell>
                                        <TableCell className="text-neutral-700">{order.style}</TableCell>
                                        <TableCell className="text-right font-mono text-neutral-900">{order.quantity}</TableCell>
                                        <TableCell className="text-neutral-700">
                                            {new Date(order.delivery).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={order.status === 'in_progress' ? 'default' : 'secondary'}
                                                className={order.status === 'in_progress' ? 'bg-blue-600' : 'bg-amber-600'}
                                            >
                                                {order.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">View</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
