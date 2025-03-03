export type WHStockDto = {
    id: number;
    name: string;
    quantity: number;
    unitOfMeasure: string;
    criticalValue: number;
    sellByUnit: boolean;
    imagePath: string | null;
    imageUrl: string | null;
    moq: number | null;
};


export type WHStockInputHistoryDto = {
    id: number;
    qty: number;
    moq: number;
    actualTotalQty: number;
    expectedTotalQty: number;
    deliveredBy: string;
    deliveryDate: Date;
} & {
    [key: string]: string | number | Date;
};

export type WHStockInputDto = {
    id: number;
    qty: number;
    actualTotalQty: number;
    expectedTotalQty: number;
    deliveredBy: string;
    deliveryDate: Date;
} & {
    [key: string]: string | number | Date;
};