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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function BuyersPage() {
    const supabase = await createClient()

    // Sample buyers
    const buyers = [
        { id: '1', name: 'ABC Textiles', contact: 'John Smith', email: 'john@abc.com', country: 'USA', orders: 15 },
        { id: '2', name: 'XYZ Garments', contact: 'Jane Doe', email: 'jane@xyz.com', country: 'UK', orders: 8 },
    ]

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Buyers</h2>
                    <p className="text-neutral-600">Manage buyer information and contacts</p>
                </div>
                <Link href="/dashboard/textile/buyers/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Buyer
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Buyers</CardTitle>
                    <CardDescription>Customer and buyer directory</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Buyer Name</TableHead>
                                    <TableHead>Contact Person</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Country</TableHead>
                                    <TableHead className="text-right">Total Orders</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {buyers.map((buyer) => (
                                    <TableRow key={buyer.id}>
                                        <TableCell className="font-medium text-neutral-900">{buyer.name}</TableCell>
                                        <TableCell className="text-neutral-700">{buyer.contact}</TableCell>
                                        <TableCell className="text-neutral-700">{buyer.email}</TableCell>
                                        <TableCell className="text-neutral-700">{buyer.country}</TableCell>
                                        <TableCell className="text-right font-mono text-neutral-900">{buyer.orders}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Edit</Button>
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
