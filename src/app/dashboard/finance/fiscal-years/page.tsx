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

export default async function FiscalYearsPage() {
    const supabase = await createClient()

    const { data: fiscalYears } = await supabase
        .from('fiscal_years')
        .select('*')
        .order('start_date', { ascending: false })

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Fiscal Years</h2>
                    <p className="text-neutral-600">Manage fiscal years and accounting periods</p>
                </div>
                <Link href="/dashboard/finance/fiscal-years/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Fiscal Year
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Fiscal Years</CardTitle>
                    <CardDescription>View and manage fiscal years</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>End Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fiscalYears && fiscalYears.length > 0 ? (
                                    fiscalYears.map((fy) => (
                                        <TableRow key={fy.id}>
                                            <TableCell className="font-medium text-neutral-900">{fy.name}</TableCell>
                                            <TableCell className="text-neutral-700">
                                                {new Date(fy.start_date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-neutral-700">
                                                {new Date(fy.end_date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={fy.is_closed ? 'secondary' : 'default'}>
                                                    {fy.is_closed ? 'Closed' : 'Open'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">Edit</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-neutral-600">
                                            No fiscal years found. Create your first fiscal year to get started.
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
