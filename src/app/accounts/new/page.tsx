import AccountForm from "@/components/modules/accounts/account-form";

export default function NewAccountPage() {
    return (
        <div className="container mx-auto py-10 px-4 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">New Account</h1>
                <p className="text-muted-foreground">
                    Add a new account to your chart of accounts.
                </p>
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <AccountForm />
            </div>
        </div>
    );
}
