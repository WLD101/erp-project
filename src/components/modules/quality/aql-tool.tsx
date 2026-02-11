"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getAQLSampleSize } from "@/lib/qc-utils";

export default function AQLCalculator() {
    const [batchSize, setBatchSize] = useState<number>(0);
    const [result, setResult] = useState<{ sampleSize: number; maxDefects: number } | null>(null);

    const handleCalculate = () => {
        setResult(getAQLSampleSize(batchSize));
    };

    return (
        <Card className="max-w-md">
            <CardHeader>
                <CardTitle>AQL 2.5 Calculator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="batch">Batch Size (Pieces)</Label>
                    <Input
                        id="batch"
                        type="number"
                        placeholder="e.g. 1200"
                        onChange={(e) => setBatchSize(Number(e.target.value))}
                    />
                </div>
                <Button onClick={handleCalculate} className="w-full">Get Sample Size</Button>

                {result && (
                    <div className="mt-4 p-4 bg-muted rounded-md space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Inspect:</span>
                            <span className="font-bold">{result.sampleSize} pcs</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Accept if Major Defects ≤:</span>
                            <span className="font-bold text-green-600">{result.maxDefects}</span>
                        </div>
                        <p className="text-xs text-muted-foreground pt-2">
                            Standard: General Inspection Level II
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
