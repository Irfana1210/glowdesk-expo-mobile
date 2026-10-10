/** One trading hour. `hour` is 0 to 23 in store-local time. */
export type HourlySales = {
  hour: number;
  sales: number;
  target: number;
};

/** Daily trading summary for one store (brief §6, Screen 1). Currency is AUD. */
export type StoreSalesSummary = {
  businessDate: string;
  hourly: Array<HourlySales>;
  labourSpend: number;
  salesAmount: number;
  salesTarget: number;
  storeId: string;
  storeName: string;
  transactionCount: number;
};
