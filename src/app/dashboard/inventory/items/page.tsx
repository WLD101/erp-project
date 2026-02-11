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

export default async function ItemsPage() {
    const supabase = await createClient()

    const { data: items, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name')

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Item Master</h2>
                    <p className="text-neutral-600">Manage all inventory items</p>
                </div>
                <Link href="/dashboard/inventory/items/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Item
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Items</CardTitle>
                    <CardDescription>Complete list of inventory items</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items && items.length > 0 ? (
                                    items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-mono font-medium text-neutral-900">{item.item_code || '-'}</TableCell>
                                            <TableCell className="text-neutral-700">{item.name}</TableCell>
                                            <TableCell className="text-neutral-600">{item.category || '-'}</TableCell>
                                            <TableCell className="text-neutral-600">{item.unit || 'pcs'}</TableCell>
                                            <TableCell className="text-right font-medium text-neutral-900">{item.quantity || 0}</TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/dashboard/inventory/items/${item.id}`}>
                                                    <Button variant="ghost" size="sm">Edit</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-neutral-600">
                                            No items found. Create your first item to get started.
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
