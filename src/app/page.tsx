import { getMockTextileData } from "@/services/textile-mock-service";
import KPISection from "@/components/modules/dashboard/kpi-section";
import ProductionTimeline from "@/components/modules/dashboard/production-timeline";
import InventoryAlert from "@/components/modules/dashboard/inventory-alert";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function DashboardPage() {
  const data = getMockTextileData();

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Factory Dashboard</h2>
          <p className="text-muted-foreground">Overview of today's production across all shifts.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      <KPISection data={data} />

      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-4">
        <ProductionTimeline data={data.productionTimeline} />
        <InventoryAlert data={data.inventoryAlerts} />
      </div>
    </div>
  );
}
