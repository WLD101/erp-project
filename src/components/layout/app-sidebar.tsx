"use client"

import * as React from "react"
import Link from "next/link"
import {
    BookOpen,
    Bot,
    Command,
    Frame,
    LifeBuoy,
    Map,
    PieChart,
    Settings2,
    SquareTerminal,
    Activity,
    Users,
    ShieldAlert,
    Archive,
    LayoutDashboard
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from "@/components/ui/sidebar"

// Mock Profile for visual completeness
const user = {
    name: "Super Admin",
    email: "admin@erp-control.com",
    avatar: "/avatars/shadcn.jpg",
}

import { useTenantFeatures } from "@/hooks/use-tenant-features"
import { Factory, Banknote, FileCheck } from "lucide-react"

// ... imports ...

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { hasFeature, loading } = useTenantFeatures()

    if (loading) return null // or skeleton

    return (
        <Sidebar variant="inset" {...props}>
            {/* ... Header ... */}
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" render={
                            <a href="#">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-indigo-600 text-sidebar-primary-foreground text-white">
                                    <Command className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">ERP Control Tower</span>
                                    <span className="truncate text-xs">Enterprise Edition</span>
                                </div>
                            </a>
                        } />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu className="mt-4 px-2">
                    <SidebarMenuItem>
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500">Platform</div>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton isActive render={
                            <Link href="/dashboard">
                                <LayoutDashboard />
                                <span>Control Tower</span>
                            </Link>
                        } />
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton render={
                            <Link href="/dashboard/tenants">
                                <Users />
                                <span>Tenants</span>
                            </Link>
                        } />
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton render={
                            <Link href="/dashboard/security">
                                <ShieldAlert />
                                <span>Security & RLS</span>
                            </Link>
                        } />
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton render={
                            <Link href="/dashboard/system-health">
                                <Activity />
                                <span>System Health</span>
                            </Link>
                        } />
                    </SidebarMenuItem>
                </SidebarMenu>

                <SidebarSeparator className="my-4" />

                <SidebarMenu className="px-2">
                    <SidebarMenuItem>
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500">Business Modules</div>
                    </SidebarMenuItem>

                    {/* Core Modules - Always visible */}
                    <SidebarMenuItem>
                        <SidebarMenuButton render={
                            <Link href="/dashboard/finance">
                                <PieChart />
                                <span>Finance</span>
                            </Link>
                        } />
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton render={
                            <Link href="/dashboard/inventory">
                                <Archive />
                                <span>Inventory</span>
                            </Link>
                        } />
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton render={
                            <Link href="/dashboard/accounts">
                                <Users />
                                <span>User Management</span>
                            </Link>
                        } />
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton render={
                            <Link href="/dashboard/production">
                                <Factory />
                                <span>Production</span>
                            </Link>
                        } />
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton render={
                            <Link href="/dashboard/quality">
                                <FileCheck />
                                <span>Quality Control</span>
                            </Link>
                        } />
                    </SidebarMenuItem>

                    {/* GATED MODULES */}
                    {hasFeature('textile_manufacturing') && (
                        <SidebarMenuItem>
                            <SidebarMenuButton className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100" render={
                                <Link href="/dashboard/textile">
                                    <Factory />
                                    <span>Textile TNA</span>
                                </Link>
                            } />
                        </SidebarMenuItem>
                    )}

                    {hasFeature('fbr_integration') && (
                        <SidebarMenuItem>
                            <SidebarMenuButton render={
                                <Link href="/dashboard/finance/fbr">
                                    <FileCheck />
                                    <span>FBR E-Invoicing</span>
                                </Link>
                            } />
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarContent>
            {/* ... Footer ... */}
            <SidebarFooter>
                <div className="p-4 border-t flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 border flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-600">SA</span>
                    </div>
                    <div className="text-sm">
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
