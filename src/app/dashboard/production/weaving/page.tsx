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

export default async function WeavingPage() {
    const supabase = await createClient()

    // Sample weaving data
    const weavingJobs = [
        { id: '1', loom_no: 'L-001', order: 'PO-001', operator: 'John Doe', status: 'running', efficiency: 85 },
        { id: '2', loom_no: 'L-002', order: 'PO-002', operator: 'Jane Smith', status: 'idle', efficiency: 0 },
    ]

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Weaving Execution</h2>
                    <p className="text-neutral-600">Monitor loom operations and efficiency</p>
                </div>
                <Link href="/dashboard/production/weaving/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Start Weaving
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Looms</CardTitle>
                    <CardDescription>Real-time loom status and performance</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Loom #</TableHead>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Operator</TableHead>
                                    <TableHead className="text-right">Efficiency %</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {weavingJobs.map((job) => (
                                    <TableRow key={job.id}>
                                        <TableCell className="font-mono text-neutral-900">{job.loom_no}</TableCell>
                                        <TableCell className="text-neutral-700">{job.order}</TableCell>
                                        <TableCell className="text-neutral-700">{job.operator}</TableCell>
                                        <TableCell className="text-right font-bold text-neutral-900">{job.efficiency}%</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={job.status === 'running' ? 'default' : 'secondary'}
                                                className={job.status === 'running' ? 'bg-emerald-600' : ''}
                                            >
                                                {job.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Details</Button>
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
