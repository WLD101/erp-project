"use client"

import { TNABoard } from "@/components/textile/tna-board"
import { useTenantFeatures } from "@/hooks/use-tenant-features"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert, Loader2 } from "lucide-react"

export default function TextileDashboardPage() {
    const { hasFeature, loading } = useTenantFeatures()
    const FEATURE_KEY = 'textile_manufacturing'

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
    }

    if (!hasFeature(FEATURE_KEY)) {
        return (
            <div className="p-8">
                <Alert variant="error">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        Your organization does not have access to the <strong>Textile Manufacturing</strong> module.
                        Please upgrade to the Enterprise Plan.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Textile Production</h2>
            </div>
            <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-semibold tracking-tight">Time & Action Board</h2>
                        <p className="text-sm text-muted-foreground">
                            Track production orders and critical path milestones.
                        </p>
                    </div>
                </div>
                <TNABoard />
            </div>
        </div>
    )
}
