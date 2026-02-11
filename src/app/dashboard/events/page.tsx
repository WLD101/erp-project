export const dynamic = 'force-dynamic'

import { EventMonitor } from '@/components/events/event-monitor'

export default function EventsPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Event Monitor</h2>
                <p className="text-neutral-600">
                    Monitor cross-module automation events and workflow triggers
                </p>
            </div>

            <EventMonitor />
        </div>
    )
}
