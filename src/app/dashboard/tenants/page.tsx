import { getTenants } from "./actions";
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
import { MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default async function TenantsPage() {
    const { tenants, error } = await getTenants();

    if (error) {
        return <div className="p-4 text-red-500">Error loading tenants: {error}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
                <Button>Add Tenant</Button>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Organization</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Users</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tenants.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No tenants found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tenants.map((tenant) => (
                                <TableRow key={tenant.id}>
                                    <TableCell className="font-medium">{tenant.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{tenant.subscription?.plan_id || 'Free'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={tenant.subscription?.status === 'active' ? 'default' : 'secondary'}
                                            className={tenant.subscription?.status === 'active' ? 'bg-green-600' : ''}
                                        >
                                            {tenant.subscription?.status || 'Active'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{tenant.user_count}</TableCell>
                                    <TableCell>{new Date(tenant.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem>Manage Subscription</DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600">Suspend Tenant</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
