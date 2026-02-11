import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export async function CostPerOrderReport() {
    const supabase = await createClient()

    const { data: orders } = await supabase
        .from('v_production_order_costs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const formatPercent = (value: number) => {
        return `${value.toFixed(2)}%`
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'draft': 'secondary',
            'confirmed': 'default',
            'materials_reserved': 'default',
            'started': 'default',
            'in_progress': 'default',
            'completed': 'default',
            'closed': 'secondary'
        }
        return colors[status] || 'secondary'
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cost Per Order Analysis</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Real-time cost tracking with material, overhead, revenue, and profit calculations
                </p>
            </CardHeader>
            <CardContent>
                {!orders || orders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No production orders found. Create and confirm orders to see cost analysis.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order #</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Material</TableHead>
                                    <TableHead className="text-right">Overhead</TableHead>
                                    <TableHead className="text-right">Total Cost</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                    <TableHead className="text-right">Profit</TableHead>
                                    <TableHead className="text-right">Margin %</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.order_id}>
                                        <TableCell className="font-mono font-medium">{order.order_number}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusColor(order.status) as any}>
                                                {order.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-sm">{formatCurrency(order.material_cost)}</TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">{formatCurrency(order.overhead_cost)}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(order.total_cost)}</TableCell>
                                        <TableCell className="text-right text-sm">{formatCurrency(order.revenue)}</TableCell>
                                        <TableCell className={`text-right font-semibold ${order.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {formatCurrency(order.profit)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className={`font-medium ${order.profit_margin_percent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {formatPercent(order.profit_margin_percent)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
