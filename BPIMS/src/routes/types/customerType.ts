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

export type TransactionDto = {
    id: number;
    totalAmount: number;
    amountReceived: number;
    slipNo: string;
    transactionDate: Date;
    branch: string;
    deliveryFee: number;
    discount: number;
    subTotal: number;
    customerName: string
}

export type TransactionItemsDto = {
    id: number;
    itemId: number;
    name: string;
    price: number;
    quantity: number;
    amount: number;
    sellByUnit: boolean;
}

export type TransactionRequestDto = {
    transaction: TransactionDto;
    transactionItems: TransactionItemsDto[];
}