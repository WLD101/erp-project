'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { retryFailedEvent } from '@/app/actions/events'

interface BusinessEvent {
    id: string
    org_id: string
    event_type: string
    entity_type: string
    entity_id: string
    payload: any
    status: 'pending' | 'processing' | 'completed' | 'failed'
    error_message?: string
    created_at: string
    processed_at?: string
}

export function EventMonitor() {
    const [events, setEvents] = useState<BusinessEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [retrying, setRetrying] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        loadEvents()

        // Subscribe to real-time updates
        const subscription = supabase
            .channel('business_events_monitor')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'business_events' },
                () => {
                    loadEvents()
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    async function loadEvents() {
        setLoading(true)
        const { data } = await supabase
            .from('business_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

        setEvents(data || [])
        setLoading(false)
    }

    async function handleRetry(eventId: string) {
        setRetrying(eventId)
        try {
            await retryFailedEvent(eventId)
            await loadEvents()
        } catch (error) {
            console.error('Retry failed:', error)
        } finally {
            setRetrying(null)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            case 'failed':
                return <XCircle className="h-4 w-4 text-rose-600" />
            case 'processing':
                return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
            default:
                return <Clock className="h-4 w-4 text-amber-600" />
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
            completed: 'default',
            failed: 'destructive',
            processing: 'secondary',
            pending: 'secondary',
        }

        return (
            <Badge variant={variants[status] || 'secondary'} className="capitalize">
                {status}
            </Badge>
        )
    }

    const stats = {
        total: events.length,
        pending: events.filter(e => e.status === 'pending').length,
        processing: events.filter(e => e.status === 'processing').length,
        completed: events.filter(e => e.status === 'completed').length,
        failed: events.filter(e => e.status === 'failed').length,
    }

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-700">Total Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700">Processing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-rose-700">Failed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600">{stats.failed}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Events List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Event Processing Monitor</CardTitle>
                            <CardDescription>Real-time cross-module automation events</CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadEvents}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading && events.length === 0 ? (
                        <div className="text-center py-8 text-neutral-600">Loading events...</div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-8 text-neutral-600">No events yet</div>
                    ) : (
                        <div className="space-y-2">
                            {events.map((event) => (
                                <div
                                    key={event.id}
                                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-neutral-50 transition-colors"
                                >
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="mt-1">{getStatusIcon(event.status)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium text-neutral-900 capitalize">
                                                    {event.event_type.replace(/_/g, ' ')}
                                                </p>
                                                {getStatusBadge(event.status)}
                                            </div>
                                            <p className="text-sm text-neutral-600">
                                                {event.entity_type} • {new Date(event.created_at).toLocaleString()}
                                            </p>
                                            {event.error_message && (
                                                <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded text-sm text-rose-900">
                                                    <AlertCircle className="h-3 w-3 inline mr-1" />
                                                    {event.error_message}
                                                </div>
                                            )}
                                            {event.processed_at && (
                                                <p className="text-xs text-neutral-500 mt-1">
                                                    Processed: {new Date(event.processed_at).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {event.status === 'failed' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRetry(event.id)}
                                            disabled={retrying === event.id}
                                        >
                                            {retrying === event.id ? (
                                                <RefreshCw className="h-3 w-3 animate-spin" />
                                            ) : (
                                                'Retry'
                                            )}
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
