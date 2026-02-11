'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { updateOrganizationSettings } from '@/app/actions/organization-settings'
import { Loader2, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface OrganizationSettingsFormProps {
    settings: any
}

export function OrganizationSettingsForm({ settings }: OrganizationSettingsFormProps) {
    const [formData, setFormData] = useState(settings || {
        base_currency: 'PKR',
        default_tax_rate: 0,
        fbr_enabled: false,
        default_uom: 'pcs',
        allow_negative_inventory: false,
        auto_confirm_orders: false,
        timezone: 'Asia/Karachi',
        date_format: 'DD/MM/YYYY'
    })
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await updateOrganizationSettings(formData)

            if (result.success) {
                toast({
                    title: 'Settings Updated',
                    description: 'Organization settings have been saved successfully.'
                })
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to update settings',
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Currency Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Currency Settings</CardTitle>
                    <CardDescription>Configure currency and exchange rates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="base_currency">Base Currency</Label>
                        <Input
                            id="base_currency"
                            value={formData.base_currency}
                            onChange={(e) => setFormData({ ...formData, base_currency: e.target.value })}
                            placeholder="PKR"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Tax & FBR Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Tax & FBR Settings</CardTitle>
                    <CardDescription>Configure tax rates and FBR integration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="default_tax_rate">Default Tax Rate (%)</Label>
                        <Input
                            id="default_tax_rate"
                            type="number"
                            step="0.01"
                            value={formData.default_tax_rate}
                            onChange={(e) => setFormData({ ...formData, default_tax_rate: parseFloat(e.target.value) })}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="fbr_enabled"
                            checked={formData.fbr_enabled}
                            onCheckedChange={(checked) => setFormData({ ...formData, fbr_enabled: checked })}
                        />
                        <Label htmlFor="fbr_enabled">Enable FBR Integration</Label>
                    </div>

                    {formData.fbr_enabled && (
                        <>
                            <div>
                                <Label htmlFor="fbr_pos_id">FBR POS ID</Label>
                                <Input
                                    id="fbr_pos_id"
                                    value={formData.fbr_pos_id || ''}
                                    onChange={(e) => setFormData({ ...formData, fbr_pos_id: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="fbr_branch_code">FBR Branch Code</Label>
                                <Input
                                    id="fbr_branch_code"
                                    value={formData.fbr_branch_code || ''}
                                    onChange={(e) => setFormData({ ...formData, fbr_branch_code: e.target.value })}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Units of Measure */}
            <Card>
                <CardHeader>
                    <CardTitle>Units of Measure</CardTitle>
                    <CardDescription>Configure default units and conversions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="default_uom">Default Unit of Measure</Label>
                        <Input
                            id="default_uom"
                            value={formData.default_uom}
                            onChange={(e) => setFormData({ ...formData, default_uom: e.target.value })}
                            placeholder="pcs, kg, m, etc."
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Business Rules */}
            <Card>
                <CardHeader>
                    <CardTitle>Business Rules</CardTitle>
                    <CardDescription>Configure business logic and automation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="allow_negative_inventory"
                            checked={formData.allow_negative_inventory}
                            onCheckedChange={(checked) => setFormData({ ...formData, allow_negative_inventory: checked })}
                        />
                        <Label htmlFor="allow_negative_inventory">Allow Negative Inventory</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="auto_confirm_orders"
                            checked={formData.auto_confirm_orders}
                            onCheckedChange={(checked) => setFormData({ ...formData, auto_confirm_orders: checked })}
                        />
                        <Label htmlFor="auto_confirm_orders">Auto-Confirm Orders</Label>
                    </div>

                    <div>
                        <Label htmlFor="require_approval_threshold">Approval Threshold (PKR)</Label>
                        <Input
                            id="require_approval_threshold"
                            type="number"
                            step="0.01"
                            value={formData.require_approval_threshold || ''}
                            onChange={(e) => setFormData({ ...formData, require_approval_threshold: parseFloat(e.target.value) })}
                            placeholder="Orders above this amount require approval"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Localization */}
            <Card>
                <CardHeader>
                    <CardTitle>Localization</CardTitle>
                    <CardDescription>Configure timezone and formatting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Input
                            id="timezone"
                            value={formData.timezone}
                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="date_format">Date Format</Label>
                        <Input
                            id="date_format"
                            value={formData.date_format}
                            onChange={(e) => setFormData({ ...formData, date_format: e.target.value })}
                            placeholder="DD/MM/YYYY, MM/DD/YYYY, etc."
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Settings
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
