import { createClient } from "@/lib/supabase/server";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// Mock users for display since auth is not fully hooked up
const mockUsers = [
    { id: "1", email: "admin@erp.com", role: "Admin", status: "Active" },
    { id: "2", email: "manager@production.com", role: "Production Manager", status: "Active" },
    { id: "3", email: "store@inventory.com", role: "Store Lead", status: "Active" },
    { id: "4", email: "qc@quality.com", role: "QC Inspector", status: "Active" },
];

export default async function UserManagementPage() {
    // const supabase = await createClient();
    // Fetch logic would go here

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="relative h-10 w-10">
                        <Image src="/logo3.png" alt="Logo" fill className="object-contain" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                        <p className="text-muted-foreground">Manage system access and roles.</p>
                    </div>
                </div>
                <Button>Invite User</Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{user.role}</Badge>
                                </TableCell>
                                <TableCell>{user.status}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">Edit</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
