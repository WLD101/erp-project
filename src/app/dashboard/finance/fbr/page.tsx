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
import { Button } from '@/components/ui/button'
import { FileCheck, Send, AlertCircle } from 'lucide-react'

export default async function FBRPage() {
    const supabase = await createClient()

    const { data: fbrLogs } = await supabase
        .from('fbr_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900">FBR E-Invoicing</h2>
                <p className="text-neutral-600">Federal Board of Revenue integration and compliance</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Total Submissions</CardTitle>
                        <FileCheck className="h-4 w-4 text-neutral-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">{fbrLogs?.length || 0}</div>
                        <p className="text-xs text-neutral-600 mt-1">All time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Successful</CardTitle>
                        <Send className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">
                            {fbrLogs?.filter(log => log.status === 'success').length || 0}
                        </div>
                        <p className="text-xs text-neutral-600 mt-1">Accepted by FBR</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Failed</CardTitle>
                        <AlertCircle className="h-4 w-4 text-rose-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">
                            {fbrLogs?.filter(log => log.status === 'error').length || 0}
                        </div>
                        <p className="text-xs text-neutral-600 mt-1">Needs attention</p>
                    </CardContent>
                </Card>
            </div>

            {/* Logs */}
            <Card>
                <CardHeader>
                    <CardTitle>Submission History</CardTitle>
                    <CardDescription>Recent FBR e-invoice submissions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Invoice Reference</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>FBR Response</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fbrLogs && fbrLogs.length > 0 ? (
                                    fbrLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-neutral-700">
                                                {new Date(log.created_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="font-mono text-neutral-900">{log.invoice_ref || '-'}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={log.status === 'success' ? 'default' : 'destructive'}
                                                    className={log.status === 'success' ? 'bg-emerald-600' : ''}
                                                >
                                                    {log.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-neutral-700 max-w-xs truncate">
                                                {log.response_message || '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">View</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-neutral-600">
                                            No FBR submissions yet. Invoices will be automatically submitted when created.
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
