"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { calculate4PointScore, determineGrade } from "@/lib/qc-utils";
import { Minus, Plus, Trash2 } from "lucide-react";

type DefectLog = {
    id: number;
    points: 1 | 2 | 3 | 4;
    type: string;
};

export default function MobileInspectionPage() {
    const [logs, setLogs] = useState<DefectLog[]>([]);
    const fabricWidth = 60; // inches, hardcoded for demo
    const inspectedYards = 100; // yards, hardcoded for demo

    const addDefect = (points: 1 | 2 | 3 | 4, type: string) => {
        setLogs([...logs, { id: Date.now(), points, type }]);
    };

    const totalPoints = logs.reduce((sum, log) => sum + log.points, 0);
    const score = calculate4PointScore(totalPoints, inspectedYards, fabricWidth);
    const grade = determineGrade(score);

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
                <div className="relative h-8 w-8">
                    <Image src="/logo3.png" alt="Logo" fill className="object-contain" />
                </div>
                <h1 className="font-bold text-lg">QC Inspection</h1>
                <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                    Batch #B-102
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Status Card */}
                <Card className="p-4 bg-white shadow-sm border-0">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold">{score}</div>
                            <div className="text-xs text-muted-foreground">Points / 100 sq.yd</div>
                        </div>
                        <div>
                            <div className={`text-2xl font-bold ${grade === 'First Quality' ? 'text-green-600' : 'text-red-600'}`}>
                                {grade === 'First Quality' ? '1st' : '2nd'}
                            </div>
                            <div className="text-xs text-muted-foreground">Current Grade</div>
                        </div>
                    </div>
                </Card>

                {/* Defect Entry */}
                <div>
                    <h3 className="text-sm font-medium mb-3 text-slate-500">Log Defect (Tap to Add)</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-20 flex flex-col gap-1 border-yellow-200 bg-yellow-50" onClick={() => addDefect(1, "Slub < 3\"")}>
                            <span className="text-xl font-bold">1 Pt</span>
                            <span className="text-xs text-muted-foreground">Small Slub</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col gap-1 border-orange-200 bg-orange-50" onClick={() => addDefect(2, "Hole < 6\"")}>
                            <span className="text-xl font-bold">2 Pts</span>
                            <span className="text-xs text-muted-foreground">Medium Defect</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col gap-1 border-red-200 bg-red-50" onClick={() => addDefect(3, "Stain 6-9\"")}>
                            <span className="text-xl font-bold">3 Pts</span>
                            <span className="text-xs text-muted-foreground">Long Defect</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col gap-1 border-red-400 bg-red-100" onClick={() => addDefect(4, "Hole > 9\"")}>
                            <span className="text-xl font-bold">4 Pts</span>
                            <span className="text-xs text-muted-foreground">Major Hole</span>
                        </Button>
                    </div>
                </div>

                {/* Log History */}
                <div>
                    <h3 className="text-sm font-medium mb-2 text-slate-500">Recent Logs ({logs.length})</h3>
                    <div className="bg-white rounded-lg p-2 shadow-sm space-y-2">
                        {logs.slice().reverse().map(log => (
                            <div key={log.id} className="flex justify-between items-center p-2 border-b last:border-0 text-sm">
                                <span>{log.type}</span>
                                <div className="flex gap-4">
                                    <span className="font-bold">{log.points} pts</span>
                                </div>
                            </div>
                        ))}
                        {logs.length === 0 && <div className="text-center text-muted-foreground py-4 text-xs">No defects logged yet</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
