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

export default async function InspectionsPage() {
    const supabase = await createClient()

    // Sample inspections
    const inspections = [
        { id: '1', inspection_no: 'QC-001', product: 'Fabric A', inspector: 'John Doe', result: 'pass', date: '2024-02-01' },
        { id: '2', inspection_no: 'QC-002', product: 'Fabric B', inspector: 'Jane Smith', result: 'fail', date: '2024-02-05' },
    ]

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Quality Inspections</h2>
                    <p className="text-neutral-600">Record and track quality control inspections</p>
                </div>
                <Link href="/dashboard/quality/inspections/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Inspection
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Inspection History</CardTitle>
                    <CardDescription>All quality control inspections</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Inspection #</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Inspector</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Result</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inspections.map((inspection) => (
                                    <TableRow key={inspection.id}>
                                        <TableCell className="font-mono text-neutral-900">{inspection.inspection_no}</TableCell>
                                        <TableCell className="font-medium text-neutral-900">{inspection.product}</TableCell>
                                        <TableCell className="text-neutral-700">{inspection.inspector}</TableCell>
                                        <TableCell className="text-neutral-700">
                                            {new Date(inspection.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={inspection.result === 'pass' ? 'default' : 'destructive'}
                                                className={inspection.result === 'pass' ? 'bg-emerald-600' : ''}
                                            >
                                                {inspection.result}
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
