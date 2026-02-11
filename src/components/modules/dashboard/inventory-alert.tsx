import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { TextileKPIs } from "@/services/textile-mock-service";

export default function InventoryAlert({ data }: { data: TextileKPIs["inventoryAlerts"] }) {
    return (
        <Card className="col-span-4 lg:col-span-1 border-red-200 bg-red-50/50 dark:bg-red-900/10">
            <CardHeader>
                <CardTitle className="text-red-600 flex items-center">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    Low Stock Alert
                </CardTitle>
                <CardDescription>
                    Raw materials below reorder level.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map((alert, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-red-100 pb-2 last:border-0">
                            <div>
                                <p className="text-sm font-medium">{alert.item}</p>
                                <p className="text-xs text-muted-foreground">{alert.threshold} {alert.unit} required</p>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-red-600">{alert.stock} {alert.unit}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
