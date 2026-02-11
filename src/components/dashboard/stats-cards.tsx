"use client"

import { Activity, ShieldAlert, Users, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function StatsCards({ health }: { health: any }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">System Status</CardTitle>
                    <Activity className={`h-4 w-4 ${health?.status === 'HEALTHY' ? 'text-emerald-500' : 'text-amber-500'}`} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{health?.status || 'Unknown'}</div>
                    <p className="text-xs text-muted-foreground mt-1">Uptime: 99.9%</p>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">RLS Anomalies</CardTitle>
                    <ShieldAlert className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{health?.issues?.rls_disabled_tables?.length || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Unprotected tables</p>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Orphaned Users</CardTitle>
                    <Users className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{health?.issues?.orphaned_profiles?.length || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Accounts without orgs</p>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Cron Failures</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{health?.issues?.cron_failures?.length || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
                </CardContent>
            </Card>
        </div>
    )
}
