"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { accountSchema, AccountFormValues } from "@/components/modules/accounts/account-schema";
import { createClient } from "@/lib/supabase/client";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export default function AccountForm() {
    const router = useRouter();
    const form = useForm<AccountFormValues>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            code: "",
            name: "",
        },
    });

    async function onSubmit(data: AccountFormValues) {
        const supabase = createClient();

        // In a real app, we would get tenant_id from context/session
        // For demo, assuming RLS fills it or checking server-side
        const { error } = await supabase.from("accounts").insert([data]);

        if (error) {
            toast({
                title: "Error",
                description: "Failed to create account. " + error.message,
                variant: "destructive",
            });
            return;
        }

        toast({
            title: "Success",
            description: "Account created successfully.",
        });
        router.push("/accounts");
        router.refresh();
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Account Code</FormLabel>
                            <FormControl>
                                <Input placeholder="1001" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Account Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Cash on Hand" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select account type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="asset">Asset</SelectItem>
                                    <SelectItem value="liability">Liability</SelectItem>
                                    <SelectItem value="equity">Equity</SelectItem>
                                    <SelectItem value="revenue">Revenue</SelectItem>
                                    <SelectItem value="expense">Expense</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Create Account</Button>
            </form>
        </Form>
    );
}
