import { createClient } from '@/lib/supabase/server'
import { InventoryMoveForm } from '@/components/inventory/inventory-move-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function InventoryMovesPage() {
    const supabase = await createClient()

    // Get items and locations for the form
    const { data: items } = await supabase
        .from('inventory')
        .select('id, name, item_code, unit')
        .order('name')

    const { data: locations } = await supabase
        .from('locations')
        .select('id, name, location_code, location_type')
        .eq('is_active', true)
        .order('name')

    // Get recent moves
    const { data: recentMoves } = await supabase
        .from('inventory_transactions')
        .select(`
      *,
      inventory:item_id(name, item_code, unit),
      source_location:source_location_id(name, location_code),
      destination_location:destination_location_id(name, location_code)
    `)
        .not('move_type', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50)

    const getMoveTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            'receipt': 'default',
            'issue': 'secondary',
            'transfer': 'default',
            'adjustment': 'outline',
            'return': 'secondary',
            'shipment': 'default',
            'scrap': 'destructive'
        }
        return colors[type] || 'default'
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Inventory Moves</h1>
                <p className="text-muted-foreground">
                    Track stock movements between locations
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <InventoryMoveForm
                        items={items || []}
                        locations={locations || []}
                    />
                </div>

                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Moves</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!recentMoves || recentMoves.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No inventory moves yet. Create your first move to get started.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Item</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>From</TableHead>
                                                <TableHead></TableHead>
                                                <TableHead>To</TableHead>
                                                <TableHead className="text-right">Quantity</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentMoves.map((move: any) => (
                                                <TableRow key={move.id}>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {new Date(move.created_at).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">{move.inventory?.name}</p>
                                                            <p className="text-xs text-muted-foreground font-mono">
                                                                {move.inventory?.item_code}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={getMoveTypeColor(move.move_type) as any}>
                                                            {move.move_type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {move.source_location?.name || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {move.destination_location?.name || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {move.quantity} {move.inventory?.unit}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
