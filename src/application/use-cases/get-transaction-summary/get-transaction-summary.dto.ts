export interface GetTransactionSummaryInputDto {
  startDate: Date;
  endDate: Date;
  cardName?: string;
}

export interface GetTransactionSummaryOutputDto {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}