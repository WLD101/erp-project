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

export default async function DefectsPage() {
    const supabase = await createClient()

    // Sample defects
    const defects = [
        { id: '1', defect_no: 'DEF-001', type: 'Weaving', severity: 'major', product: 'Fabric A', status: 'open', date: '2024-02-01' },
        { id: '2', defect_no: 'DEF-002', type: 'Dyeing', severity: 'minor', product: 'Fabric B', status: 'resolved', date: '2024-02-05' },
    ]

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Defect Tracking</h2>
                    <p className="text-neutral-600">Record and manage product defects</p>
                </div>
                <Link href="/dashboard/quality/defects/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Record Defect
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Defect Log</CardTitle>
                    <CardDescription>All recorded defects and their status</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Defect #</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {defects.map((defect) => (
                                    <TableRow key={defect.id}>
                                        <TableCell className="font-mono text-neutral-900">{defect.defect_no}</TableCell>
                                        <TableCell className="text-neutral-700">{defect.type}</TableCell>
                                        <TableCell className="font-medium text-neutral-900">{defect.product}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={defect.severity === 'major' ? 'destructive' : 'secondary'}
                                                className={defect.severity === 'minor' ? 'bg-amber-600' : ''}
                                            >
                                                {defect.severity}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-neutral-700">
                                            {new Date(defect.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={defect.status === 'resolved' ? 'default' : 'secondary'}>
                                                {defect.status}
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
