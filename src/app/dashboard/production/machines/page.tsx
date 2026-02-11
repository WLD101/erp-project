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

export default async function MachinesPage() {
    const supabase = await createClient()

    // Sample machines data
    const machines = [
        { id: '1', machine_no: 'L-001', type: 'Air Jet Loom', status: 'operational', last_maintenance: '2024-01-15' },
        { id: '2', machine_no: 'L-002', type: 'Water Jet Loom', status: 'maintenance', last_maintenance: '2024-02-01' },
        { id: '3', machine_no: 'L-003', type: 'Rapier Loom', status: 'operational', last_maintenance: '2024-01-20' },
    ]

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Machines & Looms</h2>
                    <p className="text-neutral-600">Equipment inventory and maintenance tracking</p>
                </div>
                <Link href="/dashboard/production/machines/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Machine
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Equipment List</CardTitle>
                    <CardDescription>All production machines and their status</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Machine #</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Last Maintenance</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {machines.map((machine) => (
                                    <TableRow key={machine.id}>
                                        <TableCell className="font-mono text-neutral-900">{machine.machine_no}</TableCell>
                                        <TableCell className="text-neutral-700">{machine.type}</TableCell>
                                        <TableCell className="text-neutral-700">
                                            {new Date(machine.last_maintenance).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={machine.status === 'operational' ? 'default' : 'secondary'}
                                                className={machine.status === 'operational' ? 'bg-emerald-600' : 'bg-amber-600'}
                                            >
                                                {machine.status}
                                            </Badge>
                                        </TableCell>
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
