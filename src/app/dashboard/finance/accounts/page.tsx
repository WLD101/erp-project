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

export default async function AccountsPage() {
    const supabase = await createClient()

    const { data: accounts, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('is_active', true)
        .order('code')

    const accountsByType = {
        ASSET: accounts?.filter(a => a.type === 'ASSET') || [],
        LIABILITY: accounts?.filter(a => a.type === 'LIABILITY') || [],
        EQUITY: accounts?.filter(a => a.type === 'EQUITY') || [],
        INCOME: accounts?.filter(a => a.type === 'INCOME') || [],
        EXPENSE: accounts?.filter(a => a.type === 'EXPENSE') || [],
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Chart of Accounts</h2>
                    <p className="text-neutral-600">Manage your account structure</p>
                </div>
                <Link href="/dashboard/finance/accounts/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Account
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6">
                {Object.entries(accountsByType).map(([type, typeAccounts]) => (
                    <Card key={type}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{type} Accounts</span>
                                <Badge variant="outline">{typeAccounts.length}</Badge>
                            </CardTitle>
                            <CardDescription>
                                {type === 'ASSET' && 'Resources owned by the company'}
                                {type === 'LIABILITY' && 'Obligations and debts'}
                                {type === 'EQUITY' && 'Owner\'s equity and retained earnings'}
                                {type === 'INCOME' && 'Revenue and income sources'}
                                {type === 'EXPENSE' && 'Operating costs and expenses'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Account Name</TableHead>
                                            <TableHead>Currency</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {typeAccounts.length > 0 ? (
                                            typeAccounts.map((account) => (
                                                <TableRow key={account.id}>
                                                    <TableCell className="font-mono font-medium text-neutral-900">{account.code}</TableCell>
                                                    <TableCell className="text-neutral-700">{account.name}</TableCell>
                                                    <TableCell className="text-neutral-600">{account.currency}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Link href={`/dashboard/finance/accounts/${account.id}`}>
                                                            <Button variant="ghost" size="sm">Edit</Button>
                                                        </Link>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-4 text-neutral-600">
                                                    No {type.toLowerCase()} accounts found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
