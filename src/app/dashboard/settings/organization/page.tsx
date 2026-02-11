import { getOrganizationSettings } from '@/app/actions/organization-settings'
import { OrganizationSettingsForm } from '@/components/settings/organization-settings-form'

export const dynamic = 'force-dynamic'

export default async function OrganizationSettingsPage() {
    const settings = await getOrganizationSettings()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Organization Settings</h1>
                <p className="text-muted-foreground">
                    Configure global defaults and business rules for your organization
                </p>
            </div>

            <OrganizationSettingsForm settings={settings} />
        </div>
    )
}
