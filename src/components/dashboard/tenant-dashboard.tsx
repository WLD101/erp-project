'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    PieChart,
    Archive,
    Users,
    Factory,
    FileCheck,
    TrendingUp,
    ArrowRight,
    Activity
} from 'lucide-react'

export function TenantDashboard() {
    const [profile, setProfile] = useState<any>(null)
    const [stats, setStats] = useState({
        totalAccounts: 0,
        totalItems: 0,
        totalUsers: 0,
        lowStockItems: 0,
    })
    const supabase = createClient()

    useEffect(() => {
        async function loadData() {
            // Get user profile
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: userProfile } = await supabase
                    .from('user_profiles')
                    .select('*, organizations(org_name)')
                    .eq('id', user.id)
                    .single()
                setProfile(userProfile)

                // Load stats
                if (userProfile?.org_id) {
                    const [accounts, items, users] = await Promise.all([
                        supabase.from('chart_of_accounts').select('id', { count: 'exact', head: true }).eq('org_id', userProfile.org_id),
                        supabase.from('inventory').select('id', { count: 'exact', head: true }).eq('org_id', userProfile.org_id),
                        supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('org_id', userProfile.org_id),
                    ])

                    const { data: lowStock } = await supabase
                        .from('inventory')
                        .select('id')
                        .eq('org_id', userProfile.org_id)
                        .lt('quantity', 10)

                    setStats({
                        totalAccounts: accounts.count || 0,
                        totalItems: items.count || 0,
                        totalUsers: users.count || 0,
                        lowStockItems: lowStock?.length || 0,
                    })
                }
            }
        }
        loadData()
    }, [])

    if (!profile) {
        return <div className="p-8 text-center text-neutral-600">Loading...</div>
    }

    const modules = [
        {
            title: 'Finance',
            description: 'Manage accounts, invoices, and reports',
            icon: PieChart,
            href: '/dashboard/finance',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Inventory',
            description: 'Track stock levels and movements',
            icon: Archive,
            href: '/dashboard/inventory',
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
        },
        {
            title: 'User Management',
            description: 'Manage users and permissions',
            icon: Users,
            href: '/dashboard/accounts',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            title: 'Production',
            description: 'Monitor manufacturing operations',
            icon: Factory,
            href: '/dashboard/production',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
        },
        {
            title: 'Quality Control',
            description: 'Track inspections and defects',
            icon: FileCheck,
            href: '/dashboard/quality',
            color: 'text-rose-600',
            bgColor: 'bg-rose-50',
        },
    ]

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-8 text-white">
                <h1 className="text-3xl font-bold mb-2">
                    Welcome back, {profile.full_name || 'User'}!
                </h1>
                <p className="text-blue-100 text-lg">
                    {profile.organizations?.org_name || 'Your Organization'} • {profile.role}
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Chart of Accounts</CardTitle>
                        <PieChart className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">{stats.totalAccounts}</div>
                        <p className="text-xs text-neutral-600 mt-1">Active accounts</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Inventory Items</CardTitle>
                        <Archive className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">{stats.totalItems}</div>
                        <p className="text-xs text-neutral-600 mt-1">Total items</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Team Members</CardTitle>
                        <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">{stats.totalUsers}</div>
                        <p className="text-xs text-neutral-600 mt-1">Active users</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Low Stock Alert</CardTitle>
                        <Activity className="h-4 w-4 text-rose-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">{stats.lowStockItems}</div>
                        <p className="text-xs text-neutral-600 mt-1">Items below threshold</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Access Modules */}
            <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">Quick Access</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {modules.map((module) => (
                        <Link key={module.href} href={module.href}>
                            <Card className="hover:shadow-lg transition-all cursor-pointer group">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className={`p-3 rounded-lg ${module.bgColor}`}>
                                            <module.icon className={`h-6 w-6 ${module.color}`} />
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                                    </div>
                                    <CardTitle className="text-lg mt-4">{module.title}</CardTitle>
                                    <CardDescription>{module.description}</CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates across your organization</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 border rounded-lg">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <PieChart className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-neutral-900">System initialized</p>
                                <p className="text-xs text-neutral-600">Your ERP system is ready to use</p>
                            </div>
                            <span className="text-xs text-neutral-500">Just now</span>
                        </div>

                        {stats.lowStockItems > 0 && (
                            <div className="flex items-center gap-4 p-3 border rounded-lg bg-rose-50">
                                <div className="p-2 bg-rose-100 rounded-lg">
                                    <Activity className="h-4 w-4 text-rose-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-neutral-900">Low stock alert</p>
                                    <p className="text-xs text-neutral-600">{stats.lowStockItems} items need restocking</p>
                                </div>
                                <Link href="/dashboard/inventory/stock">
                                    <Button variant="ghost" size="sm">View</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
