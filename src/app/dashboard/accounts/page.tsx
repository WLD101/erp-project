export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Users2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AccountsPage() {
    const supabase = await createClient()

    // Get quick stats
    const { data: userCount } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">User Management</h2>
                    <p className="text-neutral-600">Manage users, roles, and permissions</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/accounts/invite">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Invite User
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Total Users</CardTitle>
                        <Users2 className="h-4 w-4 text-neutral-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">{userCount?.count || 0}</div>
                        <p className="text-xs text-neutral-600 mt-1">Active users</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Admins</CardTitle>
                        <Users2 className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">0</div>
                        <p className="text-xs text-neutral-600 mt-1">Administrator role</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Staff</CardTitle>
                        <Users2 className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">0</div>
                        <p className="text-xs text-neutral-600 mt-1">Staff members</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Pending Invites</CardTitle>
                        <Users2 className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">0</div>
                        <p className="text-xs text-neutral-600 mt-1">Awaiting acceptance</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/accounts/users">
                        <CardHeader>
                            <CardTitle className="text-lg">Users</CardTitle>
                            <CardDescription>View and manage all users</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/accounts/roles">
                        <CardHeader>
                            <CardTitle className="text-lg">Roles & Permissions</CardTitle>
                            <CardDescription>Configure access control</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/accounts/invite">
                        <CardHeader>
                            <CardTitle className="text-lg">Invitations</CardTitle>
                            <CardDescription>Send team invitations</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>
            </div>
        </div>
    )
}
