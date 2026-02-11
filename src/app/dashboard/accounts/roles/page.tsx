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

export default async function RolesPage() {
    const supabase = await createClient()

    // Sample roles data
    const roles = [
        { id: '1', name: 'admin', description: 'Full system access', users: 2 },
        { id: '2', name: 'staff', description: 'Standard user access', users: 15 },
        { id: '3', name: 'viewer', description: 'Read-only access', users: 5 },
    ]

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Roles & Permissions</h2>
                    <p className="text-neutral-600">Manage user roles and access control</p>
                </div>
                <Link href="/dashboard/accounts/roles/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Role
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>System Roles</CardTitle>
                    <CardDescription>Define roles and their permissions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Role Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Users</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium text-neutral-900">
                                            <Badge variant="outline">{role.name}</Badge>
                                        </TableCell>
                                        <TableCell className="text-neutral-700">{role.description}</TableCell>
                                        <TableCell className="text-right text-neutral-900">{role.users}</TableCell>
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

            {/* Permission Matrix */}
            <Card>
                <CardHeader>
                    <CardTitle>Permission Matrix</CardTitle>
                    <CardDescription>Configure permissions for each role</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Module</TableHead>
                                    <TableHead className="text-center">Admin</TableHead>
                                    <TableHead className="text-center">Staff</TableHead>
                                    <TableHead className="text-center">Viewer</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {['Finance', 'Inventory', 'Production', 'Quality'].map((module) => (
                                    <TableRow key={module}>
                                        <TableCell className="font-medium text-neutral-900">{module}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge className="bg-emerald-600">Full Access</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className="bg-blue-600">Edit</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">View Only</Badge>
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
