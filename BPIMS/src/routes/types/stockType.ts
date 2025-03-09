export type BranchStockDto = {
    id: number;
    name: string;
    quantity: number;
    unitOfMeasure: string;
    criticalValue: number;
    sellByUnit: boolean;
    moq?: number | null;
    imagePath: string | null;
    imageUrl: string | null;
    whQty: number;
};

export type StockInputDto = {
    id: number;
    qty: number;
    actualTotalQty: number;
    expectedTotalQty: number;
    deliveredBy: string;
    deliveryDate: Date;
    branchItemId: number;
} & {
    [key: string]: string | number | Date;
};

export type StockInputHistoryDto = {
    id: number;
    qty: number;
    moq: number;
    actualTotalQty: number;
    expectedTotalQty: number;
    deliveredBy: string;
    deliveryDate: Date;
    branchItemId: number | null;
    whId: number | null;
} & {
    [key: string]: string | number | Date;
};

export type ItemStock = {
    id: number;
    name: string;
    ppQty: number;
    ppName: string;
    snName: string;
    lName: string;
    snQty: number;
    lQty: number;
    whQty: number;
    whName: string;
    criticalValue: number;
    sellByUnit: boolean;
    imagePath: string | null;
    imageUrl: string | null;
    moq: number | null;
    ppId: number;
    snId: number;
    whId: number;
    lId: number
};
