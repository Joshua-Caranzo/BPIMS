import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Cart, TransactionDto, TransactionItemsDto } from '../types/salesType';
import { UserDetails } from '../types/userType';
import { BranchStockDto } from '../types/stockType';

export type RootStackParamList = {
    Home: undefined;
    SalesStack: undefined;
    HeadquarterStack: undefined
};

export type SalesStackParamList = {
    ItemStack: undefined;
    CustomerStack: undefined;
    BranchStockStack: undefined;
    SalesReportStack: undefined;
};

export type ItemStackParamList = {
    Item: undefined;
    Cart: undefined;
    DeliveryFee: { deliveryFee: string };
    Discount: { discount: string, subTotal: number };
    Payment: undefined;
    Transaction: { cart: Cart, user: UserDetails };
    SlipOrder: { transaction: TransactionDto, transactionItems: TransactionItemsDto[] };
    CustomerList: undefined;
    NewCustomer: { user: UserDetails };
};

export type CustomerStackParamList = {
    Customer: undefined;
    CustomerView: { id: number | null };
};

export type BranchStockParamList = {
    BranchStock: undefined;
    StockInput: { item: BranchStockDto, user: UserDetails }
};

export type SalesReportParamList = {
    SalesReport: undefined;
};

export type HeadQuarterStackParamList = {
    SalesReportStack: undefined
    UserStack: undefined
    ItemsStack: undefined
};

export type SalesReportHQParamList = {
    SalesReport: undefined;
};

export type UsersHQParamList = {
    Users: undefined;
    UserView: { id: number };
}

export type ItemsHQParamList = {
    Items: undefined;
}

export type SalesStackNavigationProps<T extends keyof SalesStackParamList> =
    NativeStackScreenProps<SalesStackParamList, T>;

export type HeadQuarterNavigationProps<T extends keyof HeadQuarterStackParamList> =
    NativeStackScreenProps<HeadQuarterStackParamList, T>;

export type ItemStackNavigationProps<T extends keyof ItemStackParamList> =
    NativeStackScreenProps<ItemStackParamList, T>;

export type CustomerStackNavigationProps<T extends keyof CustomerStackParamList> =
    NativeStackScreenProps<CustomerStackParamList, T>;

export type BranchStackNavigationProps<T extends keyof BranchStockParamList> =
    NativeStackScreenProps<BranchStockParamList, T>;

export type SalesReportNavigationProps<T extends keyof SalesReportParamList> =
    NativeStackScreenProps<SalesReportParamList, T>;

export type SalesReportHQNavigationProps<T extends keyof SalesReportHQParamList> =
    NativeStackScreenProps<SalesReportHQParamList, T>;

export type UsersHQNavigationProps<T extends keyof UsersHQParamList> =
    NativeStackScreenProps<UsersHQParamList, T>;

export type ItemsHQNavigationProps<T extends keyof ItemsHQParamList> =
    NativeStackScreenProps<ItemsHQParamList, T>;