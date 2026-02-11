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

export default async function TransactionsPage() {
    const supabase = await createClient()

    const { data: transactions } = await supabase
        .from('inventory_transactions')
        .select('*, inventory(name)')
        .order('transaction_date', { ascending: false })
        .limit(50)

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Stock Transactions</h2>
                    <p className="text-neutral-600">View all inventory movements</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/inventory/transactions/in">
                        <Button variant="outline">Stock In</Button>
                    </Link>
                    <Link href="/dashboard/inventory/transactions/out">
                        <Button>Stock Out</Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>All stock movements and adjustments</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead>Reference</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions && transactions.length > 0 ? (
                                    transactions.map((txn) => (
                                        <TableRow key={txn.id}>
                                            <TableCell className="text-neutral-700">
                                                {new Date(txn.transaction_date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="font-medium text-neutral-900">
                                                {txn.inventory?.name || 'Unknown Item'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={txn.transaction_type === 'IN' ? 'default' : 'secondary'}
                                                    className={txn.transaction_type === 'IN' ? 'bg-emerald-600' : 'bg-rose-600'}
                                                >
                                                    {txn.transaction_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-neutral-900">
                                                {txn.quantity}
                                            </TableCell>
                                            <TableCell className="text-neutral-700">{txn.reference_no || '-'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-neutral-600">
                                            No transactions found. Stock movements will appear here.
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
