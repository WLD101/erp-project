import { CostPerOrderReport } from '@/components/reports/cost-per-order-report'

export const dynamic = 'force-dynamic'

export default async function CostAnalysisPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Cost Analysis</h1>
                <p className="text-muted-foreground">
                    Real-time profitability analysis across production orders
                </p>
            </div>

            <CostPerOrderReport />
        </div>
    )
}
