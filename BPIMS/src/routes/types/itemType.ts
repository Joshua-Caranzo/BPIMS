
export type ItemHQDto = {
    id: number;
    name: string;
    categoryId: number;
    categoryName: string
    price: number;
    cost: number;
    isManaged: boolean;
    imagePath: string | null;
    imageUrl: string | null;
    sellbyUnit: boolean;
    moq: number;
    criticalValue: number;
    unitOfMeasure: string;
} & {
    [key: string]: string | number | Date | boolean | null;
};