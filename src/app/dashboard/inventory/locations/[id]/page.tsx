import { createClient } from '@/lib/supabase/server'
import { LocationInventoryView } from '@/components/inventory/location-inventory-view'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function LocationDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()

    const { data: location } = await supabase
        .from('locations')
        .select('*')
        .eq('id', params.id)
        .single()

    if (!location) {
        return <div>Location not found</div>
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

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/inventory/locations">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Locations
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-8 h-8 text-muted-foreground" />
                            <div>
                                <CardTitle>{location.name}</CardTitle>
                                <p className="text-sm text-muted-foreground font-mono">
                                    {location.location_code}
                                </p>
                            </div>
                        </div>
                        <Badge variant={getLocationTypeColor(location.location_type) as any}>
                            {location.location_type.replace('_', ' ')}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Address:</span>
                            <p className="font-medium">{location.address || 'Not specified'}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Status:</span>
                            <p className="font-medium">
                                <Badge variant={location.is_active ? 'default' : 'secondary'}>
                                    {location.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div>
                <h2 className="text-2xl font-bold mb-4">Inventory at this Location</h2>
                <LocationInventoryView locationId={params.id} />
            </div>
        </div>
    )
}
