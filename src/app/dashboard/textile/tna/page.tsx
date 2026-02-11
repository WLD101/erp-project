export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'

export default async function TNAPage() {
    const supabase = await createClient()

    // Sample TNA tasks
    const tnaTasks = [
        { id: '1', order: 'TO-001', task: 'Fabric Sourcing', due: '2024-02-15', status: 'completed' },
        { id: '2', order: 'TO-001', task: 'Sample Approval', due: '2024-02-20', status: 'in_progress' },
        { id: '3', order: 'TO-001', task: 'Bulk Production', due: '2024-03-01', status: 'pending' },
        { id: '4', order: 'TO-002', task: 'Fabric Sourcing', due: '2024-02-18', status: 'delayed' },
    ]

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900">TNA Calendar</h2>
                <p className="text-neutral-600">Time and Action calendar for order management</p>
            </div>

            <div className="grid gap-4">
                {['completed', 'in_progress', 'pending', 'delayed'].map((status) => {
                    const tasks = tnaTasks.filter(t => t.status === status)
                    if (tasks.length === 0) return null

                    return (
                        <Card key={status}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="capitalize">{status.replace('_', ' ')}</CardTitle>
                                    <Badge
                                        variant={status === 'completed' ? 'default' : status === 'delayed' ? 'destructive' : 'secondary'}
                                        className={
                                            status === 'completed' ? 'bg-emerald-600' :
                                                status === 'in_progress' ? 'bg-blue-600' :
                                                    status === 'pending' ? 'bg-amber-600' : ''
                                        }
                                    >
                                        {tasks.length} tasks
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {tasks.map((task) => (
                                        <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="h-4 w-4 text-neutral-600" />
                                                <div>
                                                    <p className="font-medium text-neutral-900">{task.task}</p>
                                                    <p className="text-sm text-neutral-600">Order: {task.order}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-neutral-900">
                                                    {new Date(task.due).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-neutral-600">Due date</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
