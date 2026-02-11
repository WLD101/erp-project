"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle2, Factory, AlertCircle } from "lucide-react"

interface Order {
    id: string
    order_number: string
    customer_name: string
    item_name: string
    total_quantity: number
    status: string
    due_date: string
}

export function TNABoard() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchOrders = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('production_orders')
                .select('*')
                .order('due_date', { ascending: true })

            if (data) setOrders(data)
            setLoading(false)
        }
        fetchOrders()
    }, [])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'planned': return 'bg-blue-100 text-blue-800'
            case 'in_progress': return 'bg-yellow-100 text-yellow-800'
            case 'completed': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading) return <div>Loading Production Data...</div>

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* COLUMN 1: PLANNED */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-700">Planned</h3>
                    <Badge variant="outline">{orders.filter(o => o.status === 'planned').length}</Badge>
                </div>
                {orders.filter(o => o.status === 'planned').map(order => (
                    <OrderCard key={order.id} order={order} />
                ))}
            </div>

            {/* COLUMN 2: IN PROGRESS */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-700">In Progress</h3>
                    <Badge variant="outline">{orders.filter(o => o.status === 'in_progress').length}</Badge>
                </div>
                {orders.filter(o => o.status === 'in_progress').map(order => (
                    <OrderCard key={order.id} order={order} />
                ))}
            </div>

            {/* COLUMN 3: COMPLETED */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-700">Completed</h3>
                    <Badge variant="outline">{orders.filter(o => o.status === 'completed').length}</Badge>
                </div>
                {orders.filter(o => o.status === 'completed').map(order => (
                    <OrderCard key={order.id} order={order} />
                ))}
            </div>
        </div>
    )
}

function OrderCard({ order }: { order: Order }) {
    return (
        <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-indigo-500">
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium">{order.order_number}</CardTitle>
                    <Badge variant="secondary" className="text-xs">{order.item_name}</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
                <div className="text-xs text-muted-foreground">
                    {order.customer_name || 'Generic Customer'}
                </div>

                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center text-slate-600">
                        <Factory className="mr-1 h-3 w-3" />
                        {order.total_quantity} units
                    </div>
                    <div className="flex items-center text-red-600 font-medium">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(order.due_date).toLocaleDateString()}
                    </div>
                </div>

                {/* Mock Progress Bar for T&A */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Production Progress</span>
                        <span>{(Math.random() * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${Math.random() * 100}%` }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
