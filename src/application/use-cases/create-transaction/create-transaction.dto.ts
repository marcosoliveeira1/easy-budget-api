import { Transaction } from '@/domain/entities/transaction.entity';
import { TransactionType } from '@/domain/enums/transaction-type.enum';

export interface CreateTransactionInputDto {
  type: TransactionType;
  description: string;
  amount: number;
  categoryName?: string;
  cardName?: string;
  date?: Date;
  referenceDate?: Date;
  installments?: number;
}

export interface CreateTransactionOutputDto {
  transactions: Transaction[];
}