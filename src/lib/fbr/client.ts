import { createClient } from '@/lib/supabase/client'
import { FBRInvoicePayload, FBRResponse } from './types'

export class FBRClient {
    private orgId: string
    private config: any = null

    constructor(orgId: string) {
        this.orgId = orgId
    }

    async init() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('fbr_config')
            .select('*')
            .eq('org_id', this.orgId)
            .single()

        if (error || !data) {
            throw new Error(`FBR Config not found for Org: ${this.orgId}`)
        }
        this.config = data
    }

    async postInvoice(invoiceData: FBRInvoicePayload): Promise<FBRResponse> {
        if (!this.config) await this.init()

        // 1. Prepare Mock Response logic since we don't have real creds
        console.log("Submitting to FBR:", this.config.environment, JSON.stringify(invoiceData))

        // Simulate Network Delay
        await new Promise(r => setTimeout(r, 1000))

        const mockFiscalId = `${this.config.pos_id}-${Date.now()}`

        const response: FBRResponse = {
            InvoiceNumber: invoiceData.InvoiceNumber,
            Response: 'Invoice Posted Successfully',
            Code: '100',
            FBRInvoiceNumber: mockFiscalId
        }

        // 2. Log to Database
        await this.logTransaction(invoiceData, response, 'success')

        return response
    }

    private async logTransaction(req: any, res: any, status: string) {
        const supabase = createClient()
        await supabase.from('fbr_logs').insert({
            org_id: this.orgId,
            request_payload: req,
            response_payload: res,
            fbr_invoice_number: res.FBRInvoiceNumber,
            status: status
        })
    }
}
