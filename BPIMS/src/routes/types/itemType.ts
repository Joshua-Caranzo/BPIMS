export type ItemHQDto = {
    id: number;
    name: string;
    categoryId: number;
    price: number;
    cost: number;
    isManaged: boolean;
    imagePath: string | null;
    sellbyUnit: boolean
};
