export type DailyTransactionItem = {
  id: number;
  itemName: string;
  itemId: number;
  quantity: number;
};

export type DailyTransactionDto = {
  id: number;
  totalAmount: number;
  slipNo: string;
  transactionDate: Date;
  cashierName: string;
  items: DailyTransactionItem[];
};

export type SalesGraphDto = {
  periodId: number;
  totalAmount: number
}

export type ReportRequest = {
  graphData: SalesGraphDto[];
  transactions: DailyTransactionDto[];
}

export type TotalSalesDto = {
  totalSalesPerYear: number;
  totalSalesPerMonth: number;
}

export type TopItem = {
  itemName: string;
  totalSales: number;
};

export type BranchDto = {
  name: string;
  dailyTotal: number;
  totalProfit: number;
  topItems: TopItem[];
};

export type DailyTransactionResponse = {
  branches: BranchDto[];
  totalAmount: number;
  totalProfit: number;
};
