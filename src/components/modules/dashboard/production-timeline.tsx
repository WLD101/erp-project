import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextileKPIs } from "@/services/textile-mock-service";

export default function ProductionTimeline({ data }: { data: TextileKPIs["productionTimeline"] }) {
    // Find max for scaling
    const maxOutput = Math.max(...data.map(d => d.output)) * 1.2;

    return (
        <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
                <CardTitle>Production Timeline (Per Shift)</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="flex items-end justify-around h-[200px] w-full pt-4">
                    {data.map((item, index) => {
                        const height = (item.output / maxOutput) * 100;
                        return (
                            <div key={index} className="flex flex-col items-center gap-2 group w-full">
                                <div className="relative w-16 bg-primary/90 hover:bg-primary transition-all rounded-t-sm" style={{ height: `${height}%` }}>
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold bg-background px-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.output}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground font-medium text-center">
                                    {item.shift.split('(')[0]}<br />
                                    <span className="opacity-70 text-[10px]">{item.shift.split('(')[1].replace(')', '')}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
