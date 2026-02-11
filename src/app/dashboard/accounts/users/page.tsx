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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default async function UsersPage() {
    const supabase = await createClient()

    const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*, organizations(name)')
        .order('created_at', { ascending: false })

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Users</h2>
                    <p className="text-neutral-600">Manage team members and their access</p>
                </div>
                <Link href="/dashboard/accounts/invite">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Invite User
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>Team members across all organizations</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Organization</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users && users.length > 0 ? (
                                    users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
                                                            {user.full_name?.substring(0, 2).toUpperCase() || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-neutral-900">{user.full_name || 'Unknown'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-neutral-700">{user.email || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {user.role || 'staff'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-neutral-700">{user.organizations?.name || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/dashboard/accounts/users/${user.id}`}>
                                                    <Button variant="ghost" size="sm">Edit</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-neutral-600">
                                            No users found. Invite team members to get started.
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
