'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

function AcceptInviteContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Sign Up Form State
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    // 1. Initial Auth Check
    useEffect(() => {
        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setLoading(false)
        }
        checkAuth()
    }, [supabase.auth])

    // 2. Auto-Accept if Logged In
    useEffect(() => {
        if (user && token && !processing && !success && !error) {
            acceptInvitation(user.id)
        }
    }, [user, token])

    const acceptInvitation = async (userId: string) => {
        setProcessing(true)
        setError(null)

        try {
            if (!token) throw new Error('No invitation token found.')

            const { error: rpcError } = await supabase.rpc('accept_invitation', {
                lookup_token: token,
                target_user_id: userId
            })

            if (rpcError) throw rpcError

            setSuccess(true)
            // Redirect after short delay
            setTimeout(() => {
                router.push('/dashboard')
            }, 2000)

        } catch (err: any) {
            setError(err.message || 'Failed to accept invitation.')
        } finally {
            setProcessing(false)
        }
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setProcessing(true)
        setError(null)

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            })

            if (signUpError) throw signUpError

            if (data.user) {
                setUser(data.user)
                // The effect will trigger acceptance now that user is set
            }
        } catch (err: any) {
            setError(err.message)
            setProcessing(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!token) {
        return (
            <div className="flex h-screen items-center justify-center p-4">
                <Alert variant="error" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Invalid Link</AlertTitle>
                    <AlertDescription>No invitation token was provided in the URL.</AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Accept Invitation</CardTitle>
                    <CardDescription>
                        You've been invited to join an organization.
                    </CardDescription>
                </CardHeader>
                <CardContent>

                    {/* Success State */}
                    {success && (
                        <div className="flex flex-col items-center gap-4 py-4 text-center">
                            <div className="rounded-full bg-green-100 p-3">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium">Welcome Aboard!</h3>
                                <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
                            </div>
                        </div>
                    )}

                    {/* Processing State (Logged In) */}
                    {user && !success && (
                        <div className="flex flex-col items-center gap-4 py-8 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-gray-500">Verifying invitation and setting up your profile...</p>
                        </div>
                    )}

                    {/* Sign Up Form (Logged Out) */}
                    {!user && (
                        <form onSubmit={handleSignUp} className="space-y-4">
                            {error && (
                                <Alert variant="error">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Create Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="text-sm text-gray-500">
                                Already have an account? <a href="/login?redirect=/accept-invite" className="text-primary hover:underline">Log in</a>
                            </div>

                            <Button type="submit" className="w-full" disabled={processing}>
                                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign Up & Join
                            </Button>
                        </form>
                    )}

                    {/* General Error Display (if logged in) */}
                    {user && error && !success && (
                        <Alert variant="error" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                </CardContent>
            </Card>
        </div>
    )
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <AcceptInviteContent />
        </Suspense>
    )
}
