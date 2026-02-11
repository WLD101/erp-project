"use client";

import { useState } from "react";
import {
    LayoutDashboard,
    Users,
    Activity,
    AlertTriangle,
    Trash2,
    Search,
    Building2,
    Eye,
    XCircle,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// Mock Data for Organizations
const MOCK_ORGS = [
    { id: "550e8400-e29b-41d4-a716-446655440000", name: "Acme Corp", status: "Active", created_at: "2024-01-15T10:00:00Z" },
    { id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8", name: "Globex Industries", status: "Active", created_at: "2024-02-01T14:30:00Z" },
    { id: "7a91a320-8e1c-22e2-91a5-11d15fe541d9", name: "Soylent Corp", status: "Inactive", created_at: "2023-11-20T09:15:00Z" },
    { id: "8b02b430-7f2d-33f3-02b6-22e260f652ea", name: "Initech", status: "Active", created_at: "2024-03-10T11:45:00Z" },
    { id: "9c13c540-6g3e-44g4-13c7-33f371g763fb", name: "Umbrella Corp", status: "Purge Pending", created_at: "2023-10-05T16:20:00Z" },
];

export default function SuperAdminDashboard() {
    const [impersonatedOrg, setImpersonatedOrg] = useState<{ id: string; name: string } | null>(null);

    const handleSupportMode = (org: { id: string; name: string }) => {
        setImpersonatedOrg(org);
    };

    const exitSupportMode = () => {
        setImpersonatedOrg(null);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Support Mode Banner */}
            {impersonatedOrg && (
                <div className="bg-orange-600 text-white px-6 py-3 shadow-md flex items-center justify-between sticky top-0 z-50 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center space-x-3">
                        <ShieldCheck className="w-5 h-5 animate-pulse" />
                        <span className="font-semibold text-sm md:text-base">
                            SUPPORT MODE ACTIVE: Viewing as <span className="underline decoration-2 underline-offset-2">{impersonatedOrg.name}</span>
                        </span>
                        <code className="hidden md:inline-block bg-orange-700/50 px-2 py-0.5 rounded text-xs font-mono opacity-80">
                            {impersonatedOrg.id}
                        </code>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={exitSupportMode}
                        className="bg-white text-orange-700 hover:bg-orange-50 font-bold border-0"
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Exit Support Mode
                    </Button>
                </div>
            )}

            <div className="p-8 max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <LayoutDashboard className="w-8 h-8 text-indigo-600" />
                            Super Admin Control
                        </h1>
                        <p className="text-slate-500 mt-1">Manage tenants, enforce security, and monitor system health.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search organizations..."
                                className="pl-9 w-[250px] bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="Total Organizations"
                        value="1,240"
                        icon={<Building2 className="w-4 h-4 text-slate-600" />}
                    />
                    <StatsCard
                        title="Active ERPs"
                        value="1,180"
                        icon={<Activity className="w-4 h-4 text-emerald-600" />}
                        trend="+12% this month"
                    />
                    <StatsCard
                        title="Deactivated"
                        value="60"
                        icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
                        alert
                    />
                    <StatsCard
                        title="Purge Pending"
                        value="12"
                        icon={<Trash2 className="w-4 h-4 text-red-600" />}
                        destructive
                    />
                </div>

                {/* Main Content Area */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-slate-800">Tenant Directory</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-slate-50">
                                    <TableHead className="w-[300px]">Organization Name</TableHead>
                                    <TableHead>UUID</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {MOCK_ORGS.map((org) => (
                                    <TableRow key={org.id} className="group">
                                        <TableCell className="font-medium text-slate-900">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                    {org.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                {org.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-slate-500">{org.id}</TableCell>
                                        <TableCell>
                                            <StatusBadge status={org.status} />
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-sm">
                                            {new Date(org.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleSupportMode(org)}
                                                className={`
                          text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 
                          ${impersonatedOrg?.id === org.id ? 'bg-indigo-100 ring-1 ring-indigo-200' : ''}
                        `}
                                            >
                                                <Eye className="w-4 h-4 mr-1.5" />
                                                {impersonatedOrg?.id === org.id ? 'Viewing' : 'View as Admin'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Sub-components for cleaner code
function StatsCard({ title, value, icon, trend, alert, destructive }: any) {
    return (
        <Card className={`border-slate-200 shadow-sm ${alert ? 'bg-amber-50/50' : ''} ${destructive ? 'bg-red-50/50' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-900">{value}</div>
                {trend && (
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                        {trend}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
        Inactive: "bg-amber-100 text-amber-700 border-amber-200",
        "Purge Pending": "bg-red-100 text-red-700 border-red-200",
    }[status] || "bg-slate-100 text-slate-700 border-slate-200";

    return (
        <Badge variant="outline" className={`${styles} font-medium border`}>
            {status}
        </Badge>
    );
}
