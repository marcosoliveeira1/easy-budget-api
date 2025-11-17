import { Transaction } from "@/domain/entities/transaction.entity";

export interface FindTransactionsParams {
  cardId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export interface GetSummaryParams {
  startDate: Date;
  endDate: Date;
  cardId?: string;
}

export interface ITransactionRepository {
  create(transaction: Transaction): Promise<Transaction>;
  createMany(transactions: Transaction[]): Promise<Transaction[]>;
  find(params: FindTransactionsParams): Promise<Transaction[]>;
  getSummary(params: GetSummaryParams): Promise<TransactionSummary>;
  getSummaryByCardNameAndDate(params: GetSummaryParams): Promise<Record<string, TransactionSummary>>;
}