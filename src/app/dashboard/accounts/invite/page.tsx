'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function InviteUserPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [currentOrgId, setCurrentOrgId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        email: '',
        full_name: '',
        role: 'staff',
    })

    useEffect(() => {
        async function loadOrgId() {
            const supabase = createClient()

            // Try to get current user's org_id
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('org_id')
                    .eq('id', user.id)
                    .single()

                setCurrentOrgId(profile?.org_id || null)
            } else {
                // In mock mode, get the first organization
                const { data: orgs } = await supabase
                    .from('organizations')
                    .select('id')
                    .limit(1)
                    .single()

                setCurrentOrgId(orgs?.id || null)
            }
        }
        loadOrgId()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
            const supabase = createClient()

            if (!currentOrgId) {
                throw new Error('No organization found. Please create an organization first.')
            }

            // Create a fake user ID for the new user
            const newUserId = crypto.randomUUID()

            // Insert directly into user_profiles (bypassing auth for now)
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert([{
                    id: newUserId,
                    email: formData.email,
                    full_name: formData.full_name || formData.email.split('@')[0],
                    role: formData.role,
                    org_id: currentOrgId,
                }])

            if (profileError) {
                console.error('Profile creation error:', profileError)
                throw new Error(profileError.message)
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/dashboard/accounts/users')
                router.refresh()
            }, 1500)

        } catch (err: any) {
            console.error('Error creating user:', err)
            setError(err.message || 'Failed to create user')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Add User</h2>
                <p className="text-neutral-600">Create a new user in your organization</p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="bg-emerald-50 text-emerald-900 border-emerald-200">
                    <AlertDescription>User created successfully! Redirecting...</AlertDescription>
                </Alert>
            )}

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>User Details</CardTitle>
                    <CardDescription>
                        {currentOrgId
                            ? 'Fill in the details for the new user'
                            : 'Loading organization...'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="user@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                disabled={!currentOrgId}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                                id="full_name"
                                type="text"
                                placeholder="John Doe"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                disabled={!currentOrgId}
                            />
                            <p className="text-xs text-neutral-600">Optional - defaults to email username</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role *</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) => setFormData({ ...formData, role: value })}
                                disabled={!currentOrgId}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin - Full access</SelectItem>
                                    <SelectItem value="staff">Staff - Standard access</SelectItem>
                                    <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-neutral-600 mt-1">
                                {formData.role === 'admin' && 'Can manage users, settings, and all data'}
                                {formData.role === 'staff' && 'Can create and edit data, but cannot delete'}
                                {formData.role === 'viewer' && 'Can only view data, no editing allowed'}
                            </p>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={loading || !currentOrgId}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create User
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
                </CardContent>
            </Card>
        </div>
    )
}
