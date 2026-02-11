'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { transitionState } from '@/app/actions/state-machine'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface StateActionButtonsProps {
    entityType: 'production_order' | 'invoice'
    entityId: string
    currentStatus: string
    onSuccess?: () => void
}

const ACTION_LABELS: Record<string, Record<string, string>> = {
    production_order: {
        'draft_to_confirmed': 'Confirm Order',
        'confirmed_to_materials_reserved': 'Reserve Materials',
        'materials_reserved_to_started': 'Start Production',
        'started_to_in_progress': 'Mark In Progress',
        'in_progress_to_completed': 'Complete',
        'completed_to_closed': 'Close Order',
        'draft_to_cancelled': 'Cancel',
        'confirmed_to_cancelled': 'Cancel'
    },
    invoice: {
        'draft_to_validated': 'Validate',
        'validated_to_posted': 'Post to Ledger',
        'posted_to_paid': 'Mark as Paid',
        'paid_to_reconciled': 'Reconcile',
        'draft_to_cancelled': 'Cancel'
    }
}

export function StateActionButtons({ entityType, entityId, currentStatus, onSuccess }: StateActionButtonsProps) {
    const [loading, setLoading] = useState<string | null>(null)
    const [result, setResult] = useState<any>(null)

    const availableActions = Object.entries(ACTION_LABELS[entityType])
        .filter(([key]) => key.startsWith(currentStatus + '_to_'))

    async function handleTransition(toStatus: string) {
        setLoading(toStatus)
        setResult(null)

        try {
            const response = await transitionState(entityType, entityId, toStatus)
            setResult(response)

            if (response.success && onSuccess) {
                setTimeout(onSuccess, 1500)
            }
        } catch (error: any) {
            setResult({ success: false, error: error.message })
        } finally {
            setLoading(null)
        }
    }

    if (availableActions.length === 0) {
        return null
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                {availableActions.map(([key, label]) => {
                    const toStatus = key.split('_to_')[1]
                    const isCancel = toStatus === 'cancelled'

                    return (
                        <Button
                            key={key}
                            onClick={() => handleTransition(toStatus)}
                            disabled={loading !== null}
                            variant={isCancel ? 'destructive' : 'default'}
                        >
                            {loading === toStatus ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                label
                            )}
                        </Button>
                    )
                })}
            </div>

            {result && (
                <Alert variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>
                        {result.success ? result.message : result.error}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}
