import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export async function LocationInventoryView({ locationId }: { locationId?: string }) {
    const supabase = await createClient()

    // Get user's org
    const { data: { user } } = await supabase.auth.getUser()
    let orgId: string | null = null

    if (user) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('org_id')
            .eq('id', user.id)
            .single()

        orgId = profile?.org_id
    }

    if (!orgId) {
        return <div>Organization not found</div>
    }

    // Get location inventory
    const { data: inventory } = await supabase.rpc('get_location_inventory', {
        p_org_id: orgId,
        p_location_id: locationId || null,
        p_item_id: null
    })

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const getLocationTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            'warehouse': 'default',
            'production_floor': 'secondary',
            'quality_control': 'default',
            'supplier': 'outline',
            'customer': 'outline',
            'scrap': 'destructive',
            'virtual': 'outline'
        }
        return colors[type] || 'default'
    }

    // Group by location
    const groupedInventory = inventory?.reduce((acc: any, item: any) => {
        if (!acc[item.location_id]) {
            acc[item.location_id] = {
                location: item,
                items: []
            }
        }
        acc[item.location_id].items.push(item)
        return acc
    }, {}) || {}

    return (
        <div className="space-y-6">
            {Object.values(groupedInventory).map((group: any) => (
                <Card key={group.location.location_id}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{group.location.location_name}</CardTitle>
                            <Badge variant={getLocationTypeColor(group.location.location_type) as any}>
                                {group.location.location_type.replace('_', ' ')}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item Code</TableHead>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Unit Cost</TableHead>
                                    <TableHead className="text-right">Total Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {group.items.map((item: any) => (
                                    <TableRow key={item.item_id}>
                                        <TableCell className="font-mono">{item.item_code}</TableCell>
                                        <TableCell>{item.item_name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{item.category}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {item.quantity_on_hand} {item.unit}
                                        </TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            {formatCurrency(item.unit_cost)}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {formatCurrency(item.value_on_hand)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))}

            {Object.keys(groupedInventory).length === 0 && (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        No inventory found at this location
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
