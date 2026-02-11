'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus, Trash2 } from 'lucide-react'

type InvoiceLine = {
    id: string
    description: string
    quantity: number
    rate: number
    amount: number
}

export default function NewInvoicePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        customer: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        notes: '',
    })
    const [lines, setLines] = useState<InvoiceLine[]>([
        { id: '1', description: '', quantity: 1, rate: 0, amount: 0 }
    ])

    const addLine = () => {
        setLines([...lines, {
            id: Date.now().toString(),
            description: '',
            quantity: 1,
            rate: 0,
            amount: 0
        }])
    }

    const removeLine = (id: string) => {
        setLines(lines.filter(line => line.id !== id))
    }

    const updateLine = (id: string, field: keyof InvoiceLine, value: any) => {
        setLines(lines.map(line => {
            if (line.id === id) {
                const updated = { ...line, [field]: value }
                if (field === 'quantity' || field === 'rate') {
                    updated.amount = updated.quantity * updated.rate
                }
                return updated
            }
            return line
        }))
    }

    const total = lines.reduce((sum, line) => sum + line.amount, 0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // In production, save to database
            console.log('Invoice data:', { ...formData, lines, total })
            alert('Invoice created successfully!')
            router.push('/dashboard/finance/invoices')
        } catch (error) {
            console.error('Error creating invoice:', error)
            alert('Failed to create invoice')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900">New Invoice</h2>
                <p className="text-neutral-600">Create a new customer invoice</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Invoice Details</CardTitle>
                        <CardDescription>Enter customer and invoice information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="customer">Customer Name *</Label>
                                <Input
                                    id="customer"
                                    placeholder="Customer name"
                                    value={formData.customer}
                                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="invoiceDate">Invoice Date *</Label>
                                <Input
                                    id="invoiceDate"
                                    type="date"
                                    value={formData.invoiceDate}
                                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Line Items</CardTitle>
                                <CardDescription>Add products or services</CardDescription>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addLine}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Line
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {lines.map((line, index) => (
                                <div key={line.id} className="grid grid-cols-12 gap-4 items-end">
                                    <div className="col-span-5 space-y-2">
                                        <Label>Description</Label>
                                        <Input
                                            placeholder="Item description"
                                            value={line.description}
                                            onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label>Qty</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={line.quantity}
                                            onChange={(e) => updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label>Rate</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={line.rate}
                                            onChange={(e) => updateLine(line.id, 'rate', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label>Amount</Label>
                                        <Input
                                            type="number"
                                            value={line.amount}
                                            disabled
                                            className="bg-neutral-50"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        {lines.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeLine(line.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-rose-600" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-end pt-4 border-t">
                                <div className="text-right">
                                    <p className="text-sm text-neutral-600">Total Amount</p>
                                    <p className="text-2xl font-bold text-neutral-900">
                                        PKR {total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Additional Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Payment terms, notes, etc."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                        />
                    </CardContent>
                </Card>

                <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Invoice
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    )
}
