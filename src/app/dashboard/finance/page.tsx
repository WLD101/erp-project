export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, FileText, DollarSign, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function FinancePage() {
    const supabase = await createClient()

    // Get quick stats
    const { data: journalCount } = await supabase
        .from('journal_entries')
        .select('id', { count: 'exact', head: true })

    const { data: accountCount } = await supabase
        .from('chart_of_accounts')
        .select('id', { count: 'exact', head: true })

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Finance</h2>
                    <p className="text-neutral-600">Manage your financial operations and accounting</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/finance/journals/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Journal Entry
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Total Accounts</CardTitle>
                        <FileText className="h-4 w-4 text-neutral-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">{accountCount?.count || 0}</div>
                        <p className="text-xs text-neutral-600 mt-1">Chart of Accounts</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Journal Entries</CardTitle>
                        <DollarSign className="h-4 w-4 text-neutral-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">{journalCount?.count || 0}</div>
                        <p className="text-xs text-neutral-600 mt-1">Posted transactions</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">PKR 0</div>
                        <p className="text-xs text-neutral-600 mt-1">This month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Expenses</CardTitle>
                        <TrendingUp className="h-4 w-4 text-rose-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">PKR 0</div>
                        <p className="text-xs text-neutral-600 mt-1">This month</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/finance/journals">
                        <CardHeader>
                            <CardTitle className="text-lg">Journal Entries</CardTitle>
                            <CardDescription>View and manage journal entries</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/finance/accounts">
                        <CardHeader>
                            <CardTitle className="text-lg">Chart of Accounts</CardTitle>
                            <CardDescription>Manage your account structure</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/finance/reports">
                        <CardHeader>
                            <CardTitle className="text-lg">Financial Reports</CardTitle>
                            <CardDescription>P&L, Balance Sheet, and more</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/finance/invoices">
                        <CardHeader>
                            <CardTitle className="text-lg">Invoices</CardTitle>
                            <CardDescription>Create and manage invoices</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/finance/fiscal-years">
                        <CardHeader>
                            <CardTitle className="text-lg">Fiscal Years</CardTitle>
                            <CardDescription>Manage fiscal periods</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/finance/fbr">
                        <CardHeader>
                            <CardTitle className="text-lg">FBR Integration</CardTitle>
                            <CardDescription>E-invoicing and compliance</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>
            </div>
        </div>
    )
}
