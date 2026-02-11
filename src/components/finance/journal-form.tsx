"use client"

import { useState } from "react"
import { Plus, Trash2, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AccountSelect } from "./account-select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface JournalLine {
    id: string // Temp ID for UI
    accountId: string
    description: string
    debit: number
    credit: number
}

export function JournalEntryForm() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    // Header State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [reference, setReference] = useState("")
    const [narration, setNarration] = useState("")

    // Lines State
    const [lines, setLines] = useState<JournalLine[]>([
        { id: '1', accountId: '', description: '', debit: 0, credit: 0 },
        { id: '2', accountId: '', description: '', debit: 0, credit: 0 }
    ])

    const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0)
    const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0)
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

    const addLine = () => {
        setLines([...lines, { id: crypto.randomUUID(), accountId: '', description: '', debit: 0, credit: 0 }])
    }

    const removeLine = (id: string) => {
        setLines(lines.filter(l => l.id !== id))
    }

    const updateLine = (id: string, field: keyof JournalLine, value: any) => {
        setLines(lines.map(line =>
            line.id === id ? { ...line, [field]: value } : line
        ))
    }

    const handleSubmit = async () => {
        if (!isBalanced) {
            toast({ title: "Error", description: "Journal is not balanced.", variant: "destructive" })
            return
        }
        if (totalDebit === 0) {
            toast({ title: "Error", description: "Journal cannot be empty.", variant: "destructive" })
            return
        }

        setLoading(true)
        const supabase = createClient()

        try {
            // 1. Get Org ID (Assuming user is logged in)
            const { data: { user } } = await supabase.auth.getUser()
            // In a real app component would be wrapped or we fetch org from context.
            // Relying on RLS 'default' insert behavior or explicit select if needed.
            // Ideally we need org_id for the insert, but our RLS/Triggers might handle it?
            // Actually, for inserts, we usually need to specify org_id if column is NOT NULL.
            // Let's fetch it from auth metadata for now or assume a context helper.
            // Hack for now: fetch first org I belong to
            const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user?.id).single()
            if (!profile) throw new Error("No profile found")

            // 2. Insert Header
            const { data: journal, error: jError } = await supabase
                .from('journal_entries')
                .insert({
                    org_id: profile.org_id,
                    transaction_date: date,
                    reference_number: reference,
                    narration: narration,
                    status: 'posted'
                })
                .select()
                .single()

            if (jError) throw jError

            // 3. Insert Lines
            const glLines = lines.map(line => ({
                org_id: profile.org_id,
                journal_entry_id: journal.id,
                account_id: line.accountId,
                description: line.description,
                debit: line.debit,
                credit: line.credit
            }))

            const { error: lError } = await supabase.from('gl_lines').insert(glLines)
            if (lError) throw lError

            toast({ title: "Success", description: "Journal Entry Posted Successfully." })

            // Reset
            setReference("")
            setNarration("")
            setLines([
                { id: crypto.randomUUID(), accountId: '', description: '', debit: 0, credit: 0 },
                { id: crypto.randomUUID(), accountId: '', description: '', debit: 0, credit: 0 }
            ])

        } catch (error: any) {
            toast({ title: "Failed", description: error.message, variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>New Journal Entry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Reference #</Label>
                            <Input placeholder="e.g. JV-001" value={reference} onChange={e => setReference(e.target.value)} />
                        </div>
                        <div className="col-span-1 md:col-span-3 space-y-2">
                            <Label>Narration</Label>
                            <Input placeholder="Description of the transaction..." value={narration} onChange={e => setNarration(e.target.value)} />
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Account</TableHead>
                                    <TableHead className="w-[30%]">Description</TableHead>
                                    <TableHead className="w-[10%] text-right">Debit</TableHead>
                                    <TableHead className="w-[10%] text-right">Credit</TableHead>
                                    <TableHead className="w-[10%]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lines.map((line) => (
                                    <TableRow key={line.id}>
                                        <TableCell>
                                            <AccountSelect
                                                value={line.accountId}
                                                onSelect={(val) => updateLine(line.id, 'accountId', val)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={line.description}
                                                onChange={e => updateLine(line.id, 'description', e.target.value)}
                                                className="h-8"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={line.debit}
                                                onChange={e => updateLine(line.id, 'debit', parseFloat(e.target.value) || 0)}
                                                className="h-8 text-right"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={line.credit}
                                                onChange={e => updateLine(line.id, 'credit', parseFloat(e.target.value) || 0)}
                                                className="h-8 text-right"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => removeLine(line.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
                        <Button variant="outline" size="sm" onClick={addLine}>
                            <Plus className="h-4 w-4 mr-2" /> Add Line
                        </Button>
                        <div className="flex gap-8 text-sm font-semibold">
                            <span className={!isBalanced ? "text-red-500" : "text-green-500"}>
                                Diff: {Math.abs(totalDebit - totalCredit).toFixed(2)}
                            </span>
                            <span>Total Debit: {totalDebit.toFixed(2)}</span>
                            <span>Total Credit: {totalCredit.toFixed(2)}</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="justify-end">
                    <Button onClick={handleSubmit} disabled={loading || !isBalanced} className="bg-indigo-600">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Post Journal
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
