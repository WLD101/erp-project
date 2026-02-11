'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { confirmOrder } from '@/app/actions/events'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface OrderConfirmButtonProps {
    orderId: string
    currentStatus: string
    onSuccess?: () => void
}

export function OrderConfirmButton({ orderId, currentStatus, onSuccess }: OrderConfirmButtonProps) {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const isConfirmed = currentStatus === 'confirmed'

    async function handleConfirm() {
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const response = await confirmOrder(orderId)

            if (response.success) {
                setResult(response)
                if (onSuccess) {
                    setTimeout(onSuccess, 1500)
                }
            } else {
                setError(response.error || 'Failed to confirm order')
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (isConfirmed) {
        return (
            <Button disabled variant="outline" className="gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Confirmed
            </Button>
        )
    }

    return (
        <div className="space-y-2">
            <Button
                onClick={handleConfirm}
                disabled={loading}
                className="gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Confirming...
                    </>
                ) : (
                    <>
                        <CheckCircle2 className="h-4 w-4" />
                        Confirm Order
                    </>
                )}
            </Button>

            {result && result.success && (
                <Alert className="bg-emerald-50 border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertDescription className="text-emerald-900">
                        Order confirmed! Automated {result.automation?.processed || 0} workflow(s).
                    </AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    )
}
