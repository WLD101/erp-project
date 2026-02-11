import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Database, LayoutTemplate, Layers } from "lucide-react";

export default function SystemHealthPage() {
  // Mock statuses for now - in real implementation, these would be determined by server/client checks
  const systems = [
    {
      name: "Next.js Application",
      status: "operational",
      version: "15.1.3",
      icon: <LayoutTemplate className="h-5 w-5" />,
    },
    {
      name: "Tailwind CSS",
      status: "operational",
      version: "4.0.0",
      icon: <Layers className="h-5 w-5" />,
    },
    {
      name: "Database (Supabase)",
      status: "disconnected", // Initially disconnected as per plan
      version: "Postgres 15",
      icon: <Database className="h-5 w-5" />,
    },
    {
      name: "Antigravity Kit",
      status: "operational",
      version: "2.0.0",
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
  ];

  return (
    <div className="container mx-auto py-10 px-4 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
        <p className="text-muted-foreground">
          Real-time status of ERP modules and infrastructure.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {systems.map((sys) => (
          <Card key={sys.name} className={sys.status === 'operational' ? 'border-green-500/20' : 'border-red-500/20'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {sys.name}
              </CardTitle>
              {sys.icon}
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {sys.status === 'operational' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <div className="text-2xl font-bold capitalize">{sys.status}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Version: {sys.version}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="font-semibold mb-4">Module Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <span>Accounts Module</span>
            <Badge variant="outline">Pending Initialization</Badge>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <span>Production Layer</span>
            <Badge variant="outline">Pending Initialization</Badge>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <span>Quality Control</span>
            <Badge variant="outline">Pending Initialization</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
