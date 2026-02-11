"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { createClient } from "@/lib/supabase/client"

interface Account {
    id: string
    code: string
    name: string
    type: string
}

interface AccountSelectProps {
    value?: string
    onSelect: (value: string) => void
    className?: string
}

export function AccountSelect({ value, onSelect, className }: AccountSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [accounts, setAccounts] = React.useState<Account[]>([])
    const [loading, setLoading] = React.useState(false)

    React.useEffect(() => {
        const fetchAccounts = async () => {
            setLoading(true)
            const supabase = createClient()
            const { data, error } = await supabase
                .from('chart_of_accounts')
                .select('id, code, name, type')
                .order('code')

            if (data) {
                setAccounts(data)
            }
            setLoading(false)
        }
        fetchAccounts()
    }, [])

    const selectedAccount = accounts.find((account) => account.id === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                role="combobox"
                aria-expanded={open}
                className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between", className)}
            >
                {selectedAccount
                    ? `${selectedAccount.code} - ${selectedAccount.name}`
                    : "Select account..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
                <Command>
                    <CommandInput placeholder="Search account..." />
                    <CommandList>
                        <CommandEmpty>No account found.</CommandEmpty>
                        <CommandGroup>
                            {accounts.map((account) => (
                                <CommandItem
                                    key={account.id}
                                    value={`${account.code} ${account.name}`} // Searchable string
                                    onSelect={() => {
                                        onSelect(account.id)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === account.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span className="font-mono mr-2">{account.code}</span>
                                    {account.name}
                                    <span className="ml-auto text-xs text-muted-foreground">{account.type}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
