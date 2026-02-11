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

export default async function ReportsPage() {
    const supabase = await createClient()

    // Get current org
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user?.id)
        .single()

    // Get financial report data
    const { data: balanceSheet } = await supabase
        .rpc('get_financial_report', {
            target_org_id: profile?.org_id,
            report_type: 'BS'
        })

    const { data: profitLoss } = await supabase
        .rpc('get_financial_report', {
            target_org_id: profile?.org_id,
            report_type: 'PL'
        })

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Financial Reports</h2>
                <p className="text-neutral-600">View balance sheet, P&L, and other financial statements</p>
            </div>

            {/* Balance Sheet */}
            <Card>
                <CardHeader>
                    <CardTitle>Balance Sheet</CardTitle>
                    <CardDescription>Assets, Liabilities, and Equity</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Account</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {balanceSheet && balanceSheet.length > 0 ? (
                                    balanceSheet.map((account: any, idx: number) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium text-neutral-900">
                                                <span style={{ paddingLeft: `${(account.level - 1) * 20}px` }}>
                                                    {account.account_code} - {account.account_name}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-neutral-700">{account.account_type}</TableCell>
                                            <TableCell className="text-right font-mono text-neutral-900">
                                                PKR {Number(account.total_balance || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-neutral-600">
                                            No data available. Post journal entries to see balances.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Profit & Loss */}
            <Card>
                <CardHeader>
                    <CardTitle>Profit & Loss Statement</CardTitle>
                    <CardDescription>Income and Expenses</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Account</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {profitLoss && profitLoss.length > 0 ? (
                                    profitLoss.map((account: any, idx: number) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium text-neutral-900">
                                                <span style={{ paddingLeft: `${(account.level - 1) * 20}px` }}>
                                                    {account.account_code} - {account.account_name}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-neutral-700">{account.account_type}</TableCell>
                                            <TableCell className="text-right font-mono text-neutral-900">
                                                PKR {Number(account.total_balance || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-neutral-600">
                                            No data available. Post journal entries to see P&L.
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
