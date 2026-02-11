"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";

type LoomStatus = "running" | "stopped" | "maintenance";

interface Loom {
    id: string;
    name: string;
    status: LoomStatus;
    efficiency: number;
    lastStopReason?: string;
}

// Mock data generator for 20 looms
const looms: Loom[] = Array.from({ length: 20 }, (_, i) => {
    const r = Math.random();
    let status: LoomStatus = "running";
    if (r > 0.8) status = "stopped";
    if (r > 0.95) status = "maintenance";

    return {
        id: `loom-${i + 1}`,
        name: `Loom ${String(i + 1).padStart(2, '0')}`,
        status,
        efficiency: Math.floor(Math.random() * (98 - 70) + 70),
        lastStopReason: status === "stopped" ? (Math.random() > 0.5 ? "Warp Break" : "Weft Break") : undefined
    };
});

export default function LoomMonitor() {
    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    {/* Logo as requested in headers */}
                    <div className="relative h-10 w-10">
                        <Image src="/logo3.png" alt="Logo" fill className="object-contain" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Loom Monitor</h1>
                        <p className="text-muted-foreground">Real-time production status</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Running: {looms.filter(l => l.status === 'running').length}</Badge>
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Stopped: {looms.filter(l => l.status === 'stopped').length}</Badge>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Maint: {looms.filter(l => l.status === 'maintenance').length}</Badge>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {looms.map((loom) => (
                    <Card
                        key={loom.id}
                        className={cn(
                            "transition-all hover:scale-105 cursor-pointer border-2",
                            loom.status === "running" && "border-green-500/50 bg-green-50/10",
                            loom.status === "stopped" && "border-red-500/50 bg-red-50/10 animate-pulse",
                            loom.status === "maintenance" && "border-yellow-500/50 bg-yellow-50/10",
                        )}
                    >
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">{loom.name}</CardTitle>
                                <div className={cn(
                                    "h-3 w-3 rounded-full",
                                    loom.status === "running" && "bg-green-500",
                                    loom.status === "stopped" && "bg-red-500",
                                    loom.status === "maintenance" && "bg-yellow-500",
                                )} />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                            <div className="text-2xl font-bold">{loom.efficiency}%</div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Efficiency</p>

                            {loom.status === "stopped" && (
                                <div className="mt-3 p-1 bg-red-100 text-red-800 text-xs rounded text-center font-medium">
                                    {loom.lastStopReason}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
