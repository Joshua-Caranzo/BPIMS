export type ItemDto = {
    id: number;
    name: string;
    categoryId: number;
    price: number;
    cost: number;
    isManaged: boolean;
    imagePath: string | null;
    quantity: number;
    sellbyUnit: boolean
};

export type CategoryDto = {
    id: number;
    name: string;
};

export type CartItems = {
    id: number;
    itemId: number;
    price: number;
    quantity: number;
    name: string;
    sellByUnit: boolean
}

export type Cart = {
    id: number;
    discount: number;
    deliveryFee: number;
    subTotal: number;
    customerName: string;
}

export type CartDto = {
    cart: Cart;
    cartItems: CartItems[];
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
}

export type TransactionRequestDto = {
    transaction: TransactionDto;
    transactionItems: TransactionItemsDto[];
}