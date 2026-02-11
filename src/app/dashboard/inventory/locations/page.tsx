import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function LocationsPage() {
    const supabase = await createClient()

    const { data: locations } = await supabase
        .from('locations')
        .select('*')
        .order('location_type', { ascending: true })
        .order('name', { ascending: true })

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Locations</h1>
                    <p className="text-muted-foreground">
                        Manage warehouse, production, and storage locations
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/inventory/locations/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Location
                        </Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Locations</CardTitle>
                    <CardDescription>
                        Physical and virtual locations for inventory tracking
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!locations || locations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No locations found. Create your first location to get started.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {locations.map((location) => (
                                    <TableRow key={location.id}>
                                        <TableCell className="font-mono font-medium">
                                            {location.location_code}
                                        </TableCell>
                                        <TableCell>{location.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={getLocationTypeColor(location.location_type) as any}>
                                                {location.location_type.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {location.address || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={location.is_active ? 'default' : 'secondary'}>
                                                {location.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/dashboard/inventory/locations/${location.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    View Inventory
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
