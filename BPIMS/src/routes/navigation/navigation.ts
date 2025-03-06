import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Cart, TransactionDto, TransactionItemsDto } from '../types/salesType';
import { UserDetails } from '../types/userType';
import { BranchStockDto, ItemStock, StockInputHistoryDto } from '../types/stockType';
import { ItemHQDto } from '../types/itemType';
import { CustomerListDto } from '../types/customerType';
import { WHStockDto } from '../types/whType';

export type RootStackParamList = {
    Home: undefined;
    SalesStack: undefined;
    HeadquarterStack: undefined;
    WarehouseStack: undefined;
};

export type SalesStackParamList = {
    ItemStack: undefined;
    CustomerStack: undefined;
    BranchStockStack: undefined;
    SalesReportStack: undefined;
};

export type ItemStackParamList = {
    Item: undefined;
    Cart: { user: UserDetails };
    DeliveryFee: { deliveryFee: string, user: UserDetails };
    Discount: { discount: string, subTotal: number, user: UserDetails };
    Payment: { user: UserDetails };
    Transaction: { cart: Cart, user: UserDetails, total: number };
    SlipOrder: { transaction: TransactionDto, transactionItems: TransactionItemsDto[] };
    CustomerList: { user: UserDetails };
    NewCustomer: { user: UserDetails, customers: CustomerListDto[] };
};

export type CustomerStackParamList = {
    Customer: undefined;
    CustomerView: { id: number | null, user: UserDetails, customers: CustomerListDto[], name: string | null };
    TransactionHistory: { transactionId: number }
};

export type BranchStockParamList = {
    BranchStock: undefined;
    StockInput: { item: BranchStockDto, user: UserDetails }
    StockHistory: { item: BranchStockDto, user: UserDetails, history: StockInputHistoryDto }
};

export type SalesReportParamList = {
    SalesReport: undefined;
    TransactionHistory: { transactionId: number }
};

export type HeadQuarterStackParamList = {
    SalesReportStack: undefined
    UserStack: undefined
    ItemsStack: undefined
    StockMonitorStack: undefined;
    CustomerHQStack: undefined;
};

export type SalesReportHQParamList = {
    SalesReport: undefined;
};

export type UsersHQParamList = {
    Users: undefined;
    UserView: { id: number, name: string };
}

export type ItemsHQParamList = {
    Items: undefined;
    ItemView: { item: ItemHQDto }
}

export type StockMonitorParamList = {
    StockMonitor: undefined;
    StockInput: { item: ItemStock, user: UserDetails, branchId: number | null, whId: number | null, whQty: number | null }
}

export type CustomerHQStackParamList = {
    Customer: undefined;
    CustomerView: { id: number | null, customers: CustomerListDto[] };
    TransactionHistory: { transactionId: number }
};

export type WarehouseStackParamList = {
    WHStock: undefined;
};

export type WhStockStackParamList = {
    WHScreen: undefined;
    StockInput: { item: WHStockDto, user: UserDetails }
};

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

export type StockMonitorNavigationProps<T extends keyof StockMonitorParamList> =
    NativeStackScreenProps<StockMonitorParamList, T>;

export type CustomerHQStackNavigationProps<T extends keyof CustomerHQStackParamList> =
    NativeStackScreenProps<CustomerHQStackParamList, T>;


export type WareStackNavigationProps<T extends keyof WarehouseStackParamList> =
    NativeStackScreenProps<WarehouseStackParamList, T>;

export type WHStackNavigationProps<T extends keyof WhStockStackParamList> =
    NativeStackScreenProps<WhStockStackParamList, T>;