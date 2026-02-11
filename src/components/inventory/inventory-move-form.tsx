'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createInventoryMove } from '@/app/actions/inventory-locations'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface InventoryMoveFormProps {
    items: any[]
    locations: any[]
    onSuccess?: () => void
}

const MOVE_TYPES = [
    { value: 'receipt', label: 'Receipt (Supplier → Warehouse)' },
    { value: 'issue', label: 'Issue (Warehouse → Production)' },
    { value: 'transfer', label: 'Transfer (Location → Location)' },
    { value: 'adjustment', label: 'Adjustment (Inventory Count)' },
    { value: 'return', label: 'Return (Production → Warehouse)' },
    { value: 'shipment', label: 'Shipment (Warehouse → Customer)' },
    { value: 'scrap', label: 'Scrap (Any → Waste)' }
]

export function InventoryMoveForm({ items, locations, onSuccess }: InventoryMoveFormProps) {
    const [formData, setFormData] = useState({
        itemId: '',
        quantity: 0,
        sourceLocationId: '',
        destinationLocationId: '',
        moveType: 'transfer',
        notes: ''
    })
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await createInventoryMove({
                itemId: formData.itemId,
                quantity: formData.quantity,
                sourceLocationId: formData.sourceLocationId || undefined,
                destinationLocationId: formData.destinationLocationId || undefined,
                moveType: formData.moveType,
                notes: formData.notes || undefined
            })

            if (result.success) {
                toast({
                    title: 'Success',
                    description: result.message || 'Inventory move created successfully'
                })

                // Reset form
                setFormData({
                    itemId: '',
                    quantity: 0,
                    sourceLocationId: '',
                    destinationLocationId: '',
                    moveType: 'transfer',
                    notes: ''
                })

                if (onSuccess) onSuccess()
            } else {
                toast({
                    title: 'Error',
                    description: result.error,
                    variant: 'destructive'
                })
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const selectedMoveType = MOVE_TYPES.find(t => t.value === formData.moveType)
    const needsSource = !['receipt', 'adjustment'].includes(formData.moveType)
    const needsDestination = formData.moveType !== 'shipment'

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Inventory Move</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Move Type */}
                    <div>
                        <Label htmlFor="moveType">Move Type</Label>
                        <Select
                            value={formData.moveType}
                            onValueChange={(value) => setFormData({ ...formData, moveType: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {MOVE_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Item */}
                    <div>
                        <Label htmlFor="itemId">Item</Label>
                        <Select
                            value={formData.itemId}
                            onValueChange={(value) => setFormData({ ...formData, itemId: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                                {items.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                        {item.name} ({item.item_code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Quantity */}
                    <div>
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                            id="quantity"
                            type="number"
                            step="0.01"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                            required
                        />
                    </div>

                    {/* Source Location */}
                    {needsSource && (
                        <div>
                            <Label htmlFor="sourceLocationId">Source Location</Label>
                            <Select
                                value={formData.sourceLocationId}
                                onValueChange={(value) => setFormData({ ...formData, sourceLocationId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select source location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map((loc) => (
                                        <SelectItem key={loc.id} value={loc.id}>
                                            {loc.name} ({loc.location_type})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Destination Location */}
                    {needsDestination && (
                        <div>
                            <Label htmlFor="destinationLocationId">Destination Location</Label>
                            <Select
                                value={formData.destinationLocationId}
                                onValueChange={(value) => setFormData({ ...formData, destinationLocationId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select destination location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map((loc) => (
                                        <SelectItem key={loc.id} value={loc.id}>
                                            {loc.name} ({loc.location_type})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Add any notes about this move..."
                        />
                    </div>

                    <Button type="submit" disabled={loading || !formData.itemId || formData.quantity <= 0}>
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating Move...
                            </>
                        ) : (
                            'Create Move'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
