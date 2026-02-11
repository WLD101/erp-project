export interface FBRInvoiceItem {
    ItemCode: string; // Product Code
    ItemName: string;
    PCTCode: string; // HS Code
    Quantity: number;
    TaxRate: number; // e.g. 18.00
    SaleValue: number; // Quantity * Rate
    Discount: number;
    TaxCharged: number;
    TotalAmount: number; // SaleValue + Tax - Discount
    InvoiceType: number; // 1=New, 2=Debit, 3=Credit
    RefUSIN?: string; // If refund
}

export interface FBRInvoicePayload {
    InvoiceNumber: string; // Internal ID
    POSID: number; // Application specific ID
    USIN: string; // Unique Sales Invoice Number string
    DateTime: string; // YYYY-MM-DD HH:mm:ss
    BuyerNTN: string;
    BuyerCNIC: string;
    BuyerName: string;
    BuyerPhoneNumber: string;
    Destination: string; // City
    TotalBillAmount: number;
    TotalQuantity: number;
    TotalSaleValue: number;
    TotalTaxCharged: number;
    Discount: number;
    TotalTaxAmount: number; // Usually same as TaxCharged
    PaymentMode: number; // 1=Cash, 2=Card
    RefUSIN?: string; // For returns
    InvoiceType: number; // 1=New
    Items: FBRInvoiceItem[];
}

export interface FBRResponse {
    InvoiceNumber: string;
    Response: string; // 'Success' or error message
    Code: string; // '100' = Success
    FBRInvoiceNumber: string; // The Fiscal Number
}
