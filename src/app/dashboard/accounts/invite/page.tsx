'use client'

import { useState } from 'react'
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
import { Loader2 } from 'lucide-react'

export default function InviteUserPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        role: 'staff',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const supabase = createClient()

            // Get current user's org_id
            const { data: { user } } = await supabase.auth.getUser()
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('org_id')
                .eq('id', user?.id)
                .single()

            const { error } = await supabase
                .from('invitations')
                .insert([{
                    email: formData.email,
                    role: formData.role,
                    org_id: profile?.org_id,
                    created_by: user?.id
                }])

            if (error) throw error

            alert('Invitation sent successfully!')
            router.push('/dashboard/accounts/users')
            router.refresh()
        } catch (error) {
            console.error('Error sending invitation:', error)
            alert('Failed to send invitation')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Invite User</h2>
                <p className="text-neutral-600">Send an invitation to join your organization</p>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Invitation Details</CardTitle>
                    <CardDescription>The user will receive an email with instructions to join</CardDescription>
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
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role *</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) => setFormData({ ...formData, role: value })}
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
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Invitation
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
