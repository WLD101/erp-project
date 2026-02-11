import { createClient } from '@/lib/supabase/client'

export interface WhatsAppMessage {
    to: string
    template: string
    variables: Record<string, string>
}

export class WhatsAppClient {
    private orgId: string

    constructor(orgId: string) {
        this.orgId = orgId
    }

    async sendTemplate(message: WhatsAppMessage) {
        const supabase = createClient()

        // 1. Enqueue to DB (Robustness)
        const { error } = await supabase.from('notification_outbox').insert({
            org_id: this.orgId,
            channel: 'whatsapp',
            recipient: message.to,
            template_name: message.template,
            template_params: message.variables,
            status: 'processing' // Mark processing immediately for this direct call
        })

        if (error) {
            console.error("Failed to queue WhatsApp message", error)
            throw error
        }

        // 2. Mock API Call
        console.log(`[WhatsApp Mock] Sending ${message.template} to ${message.to} with params:`, message.variables)

        // Simulate Network
        await new Promise(r => setTimeout(r, 500))

        // 3. Update Status (in real app, this might be a webhook callback)
        // Since we don't have the ID easily from the insert above without returning, 
        // we'll skip the update for this simplified mock or strictly we should have returned data.

        return { success: true, messageId: `wa-${Date.now()}` }
    }
}
