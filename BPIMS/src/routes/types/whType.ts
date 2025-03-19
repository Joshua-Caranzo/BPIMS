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
    deliveredBy: number;
    deliveredByName: string
    deliveryDate: Date;
    name: string;
    sellByUnit: boolean
} & {
    [key: string]: string | number | Date;
};

export type WHStockInputDto = {
    id: number;
    qty: number;
    actualTotalQty: number;
    expectedTotalQty: number;
    deliveredBy: number | null;
    deliveredByName: string | null;
    deliveryDate: Date;
} & {
    [key: string]: string | number | Date;
};

export type SupplierDto = {
    id: number;
    name: string;
    contactNumber1: string;
    contactNumber2: string | null;
    address: string;
};
