'use client'

import { Check, Circle, X } from 'lucide-react'

interface StatusStep {
    status: string
    label: string
    description?: string
}

interface StatusProgressBarProps {
    entityType: 'production_order' | 'invoice'
    currentStatus: string
    statusHistory?: any[]
}

const PRODUCTION_ORDER_STEPS: StatusStep[] = [
    { status: 'draft', label: 'Draft' },
    { status: 'confirmed', label: 'Confirmed' },
    { status: 'materials_reserved', label: 'Materials Reserved' },
    { status: 'started', label: 'Started' },
    { status: 'in_progress', label: 'In Progress' },
    { status: 'completed', label: 'Completed' },
    { status: 'closed', label: 'Closed' }
]

const INVOICE_STEPS: StatusStep[] = [
    { status: 'draft', label: 'Draft' },
    { status: 'validated', label: 'Validated' },
    { status: 'posted', label: 'Posted' },
    { status: 'paid', label: 'Paid' },
    { status: 'reconciled', label: 'Reconciled' }
]

export function StatusProgressBar({ entityType, currentStatus, statusHistory }: StatusProgressBarProps) {
    const steps = entityType === 'production_order' ? PRODUCTION_ORDER_STEPS : INVOICE_STEPS

    const currentIndex = steps.findIndex(s => s.status === currentStatus)
    const isCancelled = currentStatus === 'cancelled'

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const isCompleted = index < currentIndex
                    const isCurrent = index === currentIndex
                    const isFuture = index > currentIndex

                    return (
                        <div key={step.status} className="flex items-center flex-1">
                            {/* Step Circle */}
                            <div className="flex flex-col items-center">
                                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2
                  ${isCompleted ? 'bg-emerald-600 border-emerald-600' : ''}
                  ${isCurrent ? 'bg-blue-600 border-blue-600' : ''}
                  ${isFuture ? 'bg-neutral-100 border-neutral-300' : ''}
                  ${isCancelled ? 'bg-rose-600 border-rose-600' : ''}
                `}>
                                    {isCompleted && <Check className="w-5 h-5 text-white" />}
                                    {isCurrent && !isCancelled && <Circle className="w-5 h-5 text-white fill-white" />}
                                    {isCancelled && <X className="w-5 h-5 text-white" />}
                                    {isFuture && <span className="text-neutral-400 text-sm">{index + 1}</span>}
                                </div>
                                <span className={`
                  mt-2 text-xs font-medium
                  ${isCompleted || isCurrent ? 'text-neutral-900' : 'text-neutral-400'}
                `}>
                                    {step.label}
                                </span>
                            </div>

                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div className={`
                  flex-1 h-0.5 mx-2
                  ${index < currentIndex ? 'bg-emerald-600' : 'bg-neutral-300'}
                `} />
                            )}
                        </div>
                    )
                })}
            </div>

            {isCancelled && (
                <div className="mt-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-rose-100 text-rose-800">
                        <X className="w-4 h-4 mr-1" />
                        Cancelled
                    </span>
                </div>
            )}
        </div>
    )
}
