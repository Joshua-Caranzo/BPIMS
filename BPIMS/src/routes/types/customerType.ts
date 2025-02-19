export type CustomerDto = {
    id: number;
    name: string;
    branchId: number | null;
    contactNumber1: string | null;
    contactNumber2: string | null;
    totalOrderAmount: number;
    branch: string | null;
    fileUrl: string | null;
    fileName: string | null
}

export type CustomerListDto = {
    id: number;
    name: string;
    branchId: number;
}

export type OrderHistory = {
    id: number;
    totalAmount: number;
    amountReceived: number;
    slipNo: string;
    transactionDate: Date;
}

export type CustomerRequest = {
    customer: CustomerDto;
    orderHistory: OrderHistory[];
}