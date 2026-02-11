"use client";

export const dynamic = 'force-dynamic'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { createOrganization, configureFactory, finishOnboarding } from "./actions";

export default function OnboardingWizard() {
    const [step, setStep] = useState(1);
    const [progress, setProgress] = useState(25);
    const [loading, setLoading] = useState(false);
    const [orgId, setOrgId] = useState<string | null>(null);
    const router = useRouter();

    // Form States
    const [companyName, setCompanyName] = useState("");
    const [ntn, setNtn] = useState("");
    const [address, setAddress] = useState("");
    const [looms, setLooms] = useState("50");
    const [warehouses, setWarehouses] = useState("2");
    const [teamEmails, setTeamEmails] = useState<string[]>(["", ""]);

    const handleNext = async () => {
        setLoading(true);
        try {
            if (step === 1) {
                const formData = new FormData();
                formData.append("company", companyName);
                formData.append("ntn", ntn);
                formData.append("address", address);

                const res = await createOrganization(formData);
                if (res.error) {
                    toast({ title: "Error", description: res.error, variant: "destructive" });
                    setLoading(false);
                    return;
                }
                if (res.orgId) setOrgId(res.orgId);
            }

            if (step === 3 && orgId) {
                const formData = new FormData();
                formData.append("looms", looms);
                formData.append("warehouses", warehouses);
                await configureFactory(orgId, formData);
            }

            if (step === 4 && orgId) {
                await finishOnboarding(orgId, teamEmails.filter(e => e));
                router.push("/dashboard"); // Redirect to dashboard after finish
                return;
            }

            if (step < 4) {
                setStep(step + 1);
                setProgress((step + 1) * 25);
            }
        } catch (error) {
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-2xl space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Setup Your Textile ERP</h1>
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">Step {step} of 4</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {step === 1 && "Company Profile"}
                            {step === 2 && "Branding"}
                            {step === 3 && "Factory Configuration"}
                            {step === 4 && "Team Invite"}
                        </CardTitle>
                        <CardDescription>
                            {step === 1 && "Tell us about your organization."}
                            {step === 2 && "Upload your logo to personalize the dashboard."}
                            {step === 3 && "We'll set up your asset registers automatically."}
                            {step === 4 && "Add your key staff members."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {step === 1 && (
                            <div className="space-y-4">
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="company">Company Name</Label>
                                    <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Acme Textiles Ltd." />
                                </div>
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="ntn">NTN / STRN</Label>
                                    <Input id="ntn" value={ntn} onChange={(e) => setNtn(e.target.value)} placeholder="Registration Number" />
                                </div>
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="address">Address</Label>
                                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Factory Address" />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="flex flex-col items-center gap-4 py-8">
                                <div className="relative h-24 w-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-slate-50">
                                    <Image src="/logo3.png" alt="preview" width={64} height={64} className="object-contain" />
                                </div>
                                <div className="text-sm text-muted-foreground text-center">
                                    We've detected a logo. <br />
                                    <span className="font-semibold text-primary cursor-pointer">Click to upload a different one</span>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4">
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="looms">Number of Looms</Label>
                                    <Input id="looms" type="number" value={looms} onChange={(e) => setLooms(e.target.value)} />
                                    <p className="text-xs text-muted-foreground">We will generate {looms} Loom assets.</p>
                                </div>
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="warehouses">Number of Warehouses</Label>
                                    <Input id="warehouses" type="number" value={warehouses} onChange={(e) => setWarehouses(e.target.value)} />
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <Input placeholder="email@example.com" value={teamEmails[0]} onChange={(e) => { const newEmails = [...teamEmails]; newEmails[0] = e.target.value; setTeamEmails(newEmails); }} />
                                    <Input disabled value="Production Manager" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input placeholder="email@example.com" value={teamEmails[1]} onChange={(e) => { const newEmails = [...teamEmails]; newEmails[1] = e.target.value; setTeamEmails(newEmails); }} />
                                    <Input disabled value="Accountant" />
                                </div>
                                <Button variant="outline" className="w-full" size="sm" onClick={() => setTeamEmails([...teamEmails, ""])}>Add More</Button>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="ghost" disabled={step === 1 || loading} onClick={() => { setStep(step - 1); setProgress((step - 1) * 25) }}>Back</Button>
                        <Button onClick={handleNext} disabled={loading} className="min-w-[120px]">
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : step === 4 ? (
                                <>Complete Setup <CheckCircle2 className="ml-2 h-4 w-4" /></>
                            ) : "Next Step"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
