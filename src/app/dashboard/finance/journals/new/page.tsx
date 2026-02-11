import { JournalEntryForm } from "@/components/finance/journal-form"

export default function NewJournalEntryPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Financials</h2>
            </div>
            <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-semibold tracking-tight">Journal Entry</h2>
                        <p className="text-sm text-muted-foreground">
                            Record a manual double-entry transaction.
                        </p>
                    </div>
                </div>
                <JournalEntryForm />
            </div>
        </div>
    )
}
