/** One trading hour. `hour` is 0 to 23 in store-local time. */
export interface HourlySales {
  hour: number;
  sales: number;
  target: number;
}

/** Daily trading summary for one store (brief §6, Screen 1). Currency is AUD. */
export interface StoreSalesSummary {
  storeId: string;
  storeName: string;
  businessDate: string;
  salesAmount: number;
  salesTarget: number;
  transactionCount: number;
  labourSpend: number;
  hourly: HourlySales[];
}
