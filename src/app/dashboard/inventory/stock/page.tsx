export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function StockLevelsPage() {
    const supabase = await createClient()

    const { data: items } = await supabase
        .from('inventory')
        .select('*')
        .order('name')

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Stock Levels</h2>
                <p className="text-neutral-600">Current stock quantities for all items</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Current Stock</CardTitle>
                    <CardDescription>Real-time inventory levels</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item Code</TableHead>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items && items.length > 0 ? (
                                    items.map((item) => {
                                        const qty = item.quantity || 0
                                        const status = qty === 0 ? 'out' : qty < 10 ? 'low' : 'ok'

                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-mono text-neutral-900">{item.item_code || '-'}</TableCell>
                                                <TableCell className="font-medium text-neutral-900">{item.name}</TableCell>
                                                <TableCell className="text-neutral-700">{item.category || '-'}</TableCell>
                                                <TableCell className="text-right font-bold text-neutral-900">{qty}</TableCell>
                                                <TableCell className="text-neutral-700">{item.unit || 'pcs'}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={status === 'ok' ? 'default' : status === 'low' ? 'secondary' : 'destructive'}
                                                        className={
                                                            status === 'ok' ? 'bg-emerald-600' :
                                                                status === 'low' ? 'bg-amber-600' : ''
                                                        }
                                                    >
                                                        {status === 'ok' ? 'In Stock' : status === 'low' ? 'Low Stock' : 'Out of Stock'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-neutral-600">
                                            No items in inventory. Add items to track stock levels.
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
