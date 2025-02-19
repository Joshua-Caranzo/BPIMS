export type BranchStockDto = {
    id: number;
    name: string;
    quantity: number;
    unitOfMeasure: string;
    criticalValue: number;
    sellByUnit: boolean;
};

export type StockInputDto = {
    id: number;
    qty: number;
    moq: number;
    actualTotalQty: number;
    expectedTotalQty: number;
    deliveredBy: string;
    deliveryDate: Date;
    branchItemId: number;
} & {
    [key: string]: string | number | Date;
};
