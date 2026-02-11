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

export default async function InvoicesPage() {
    const supabase = await createClient()

    // For now, we'll create a simple invoices structure
    // In production, you'd have a proper invoices table
    const invoices = [
        { id: '1', number: 'INV-001', customer: 'ABC Corp', amount: 50000, status: 'paid', date: '2024-02-01' },
        { id: '2', number: 'INV-002', customer: 'XYZ Ltd', amount: 75000, status: 'pending', date: '2024-02-05' },
    ]

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Invoices</h2>
                    <p className="text-neutral-600">Create and manage customer invoices</p>
                </div>
                <Link href="/dashboard/finance/invoices/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Invoice
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Invoices</CardTitle>
                    <CardDescription>View and manage all customer invoices</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.length > 0 ? (
                                    invoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-medium text-neutral-900">{invoice.number}</TableCell>
                                            <TableCell className="text-neutral-700">{invoice.customer}</TableCell>
                                            <TableCell className="text-neutral-700">{new Date(invoice.date).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right font-mono text-neutral-900">
                                                PKR {invoice.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                                                    className={invoice.status === 'paid' ? 'bg-emerald-600' : 'bg-amber-600'}
                                                >
                                                    {invoice.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/dashboard/finance/invoices/${invoice.id}`}>
                                                    <Button variant="ghost" size="sm">View</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-neutral-600">
                                            No invoices found. Create your first invoice to get started.
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
