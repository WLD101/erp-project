import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Activity, Percent, Ban, CheckCircle } from "lucide-react";
import { TextileKPIs } from "@/services/textile-mock-service";

export default function KPISection({ data }: { data: TextileKPIs }) {
    const kpis = [
        {
            title: "Production Yield",
            value: `${data.productionYield}%`,
            desc: "Good Units / Total Started",
            icon: <Activity className="h-4 w-4 text-muted-foreground" />,
            trend: "+2.1%",
            trendUp: true
        },
        {
            title: "Equip. Utilization",
            value: `${data.equipmentUtilization}%`,
            desc: "Actual / Available Hours",
            icon: <Percent className="h-4 w-4 text-muted-foreground" />,
            trend: "+1.5%",
            trendUp: true
        },
        {
            title: "Wastage Rate",
            value: `${data.wastageRate}%`,
            desc: "Material Lost",
            icon: <Ban className="h-4 w-4 text-muted-foreground" />,
            trend: "-0.5%",
            trendUp: false // Good for wastage
        },
        {
            title: "Order Fulfillment",
            value: `${data.orderFulfillment}%`,
            desc: "On-time Completion",
            icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />,
            trend: "+4.0%",
            trendUp: true
        }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {kpi.title}
                        </CardTitle>
                        {kpi.icon}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpi.value}</div>
                        <p className="text-xs text-muted-foreground">
                            {kpi.trendUp ? (
                                <span className="text-green-500 flex items-center inline-block mr-1">
                                    <ArrowUpRight className="h-3 w-3 mr-0.5" /> {kpi.trend}
                                </span>
                            ) : (
                                <span className="text-red-500 flex items-center inline-block mr-1">
                                    <ArrowDownRight className="h-3 w-3 mr-0.5" /> {kpi.trend}
                                </span>
                            )}
                            from last month
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
