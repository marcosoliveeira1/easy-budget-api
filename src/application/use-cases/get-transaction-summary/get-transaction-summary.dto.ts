export interface GetTransactionSummaryInputDto {
  startDate: Date;
  endDate: Date;
  cardId?: string;
}

export interface GetTransactionSummaryOutputDto {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}