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

export default async function JournalsPage() {
    const supabase = await createClient()

    const { data: journals, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(50)

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Journal Entries</h2>
                    <p className="text-neutral-600">Record and manage financial transactions</p>
                </div>
                <Link href="/dashboard/finance/journals/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Entry
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Journal Entries</CardTitle>
                    <CardDescription>View all posted and draft journal entries</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Narration</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {journals && journals.length > 0 ? (
                                    journals.map((journal) => (
                                        <TableRow key={journal.id}>
                                            <TableCell className="font-medium text-neutral-900">
                                                {new Date(journal.transaction_date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-neutral-700">{journal.reference_number || '-'}</TableCell>
                                            <TableCell className="text-neutral-700">{journal.narration || '-'}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={journal.status === 'posted' ? 'default' : 'secondary'}
                                                    className={journal.status === 'posted' ? 'bg-emerald-600' : ''}
                                                >
                                                    {journal.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/dashboard/finance/journals/${journal.id}`}>
                                                    <Button variant="ghost" size="sm">View</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-neutral-600">
                                            No journal entries found. Create your first entry to get started.
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
