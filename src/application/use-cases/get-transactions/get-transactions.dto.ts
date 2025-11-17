import { TransactionType } from '@/domain/enums/transaction-type.enum';
import { RecurrenceType } from '@/domain/enums/recurrence-type.enum';

export interface GetTransactionsInputDto {
  cardId?: string;
  startDate?: Date;
  endDate?: Date;
}

interface TransactionOutput {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  categoryName?: string;
  cardName?: string;
  date: Date;
  recurrenceType: RecurrenceType;
  installmentTotal?: number;
  installmentCurrent?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetTransactionsOutputDto {
  transactions: TransactionOutput[];
}