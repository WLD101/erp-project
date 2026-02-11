import { createClient } from "@/lib/supabase/server";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function AccountsPage() {
    const supabase = await createClient();
    const { data: accounts, error } = await supabase
        .from("accounts")
        .select("*")
        .order("code", { ascending: true });

    if (error) {
        console.error("Error fetching accounts:", error);
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
                    <p className="text-muted-foreground">
                        Manage your financial accounts and ledgers.
                    </p>
                </div>
                <Link href="/accounts/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> New Account
                    </Button>
                </Link>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Created At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {accounts?.length ? (
                            accounts.map((account) => (
                                <TableRow key={account.id}>
                                    <TableCell className="font-medium">{account.code}</TableCell>
                                    <TableCell>{account.name}</TableCell>
                                    <TableCell className="capitalize">{account.type}</TableCell>
                                    <TableCell className="text-right">
                                        {new Date(account.created_at).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No accounts found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
