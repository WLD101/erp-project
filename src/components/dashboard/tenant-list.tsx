"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
    MoreVertical,
    ExternalLink,
    Power,
    RotateCcw,
    Trash2,
    Shield,
    Users
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function TenantList({ onSuccess }: { onSuccess?: () => void }) {
    const [orgs, setOrgs] = useState<any[]>([])
    const router = useRouter()
    const supabase = createClient()

    const refresh = async () => {
        const { data, error } = await supabase
            .from('organizations')
            .select('id, name, created_at, organization_subscriptions(status)')
            .order('name')

        if (data) {
            setOrgs(data.map((org: any) => ({
                org_id: org.id,
                org_name: org.name,
                is_active: org.organization_subscriptions?.[0]?.status === 'active',
                inventory_rows: 0
            })))
        }
    }

    useEffect(() => { refresh() }, [])

    const handleAction = async (action: string, orgId: string) => {
        if (action === 'deactivate') {
            await supabase.rpc('deactivate_organization', { target_org_id: orgId })
        } else if (action === 'restore') {
            await supabase.rpc('restore_organization', { target_org_id: orgId })
        } else if (action === 'purge') {
            if (confirm('Are you sure? This is destructive.')) {
                await supabase.rpc('purge_inactive_org_data', { target_org_id: orgId })
            }
        }
        refresh()
        if (onSuccess) onSuccess()
    }

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Organization Registry</CardTitle>
                    <CardDescription>Manage multi-tenant isolation and access.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[250px]">Organization</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Metrics</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orgs.map((org) => (
                                <TableRow key={org.org_id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 rounded-lg">
                                                <AvatarFallback className="rounded-lg bg-indigo-100 text-indigo-700 font-bold">
                                                    {org.org_name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm text-neutral-900">{org.org_name}</span>
                                                <span className="text-xs text-neutral-600 font-mono">{org.org_id.substring(0, 8)}...</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {org.is_active ?
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge> :
                                            <Badge variant="destructive">Inactive</Badge>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs text-neutral-700">
                                            <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> {org.inventory_rows} items</span>
                                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> 0 Staff</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" className="hidden md:flex h-8"
                                                onClick={() => router.push(`/dashboard/tenant-view?orgId=${org.org_id}`)}>
                                                <ExternalLink className="mr-2 h-3.5 w-3.5" /> Support
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4 text-neutral-600" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Tenant Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/tenant-view?orgId=${org.org_id}`)}>
                                                        <ExternalLink className="mr-2 h-4 w-4" /> Impersonate View
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {org.is_active ? (
                                                        <DropdownMenuItem onClick={() => handleAction('deactivate', org.org_id)} className="text-amber-600">
                                                            <Power className="mr-2 h-4 w-4" /> Deactivate Access
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => handleAction('restore', org.org_id)} className="text-emerald-600">
                                                            <RotateCcw className="mr-2 h-4 w-4" /> Restore Access
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => handleAction('purge', org.org_id)} className="text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Purge Data (GDPR)
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
