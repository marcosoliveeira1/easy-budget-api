import { describe, it, expect, vi } from 'vitest';
import { GetTransactionsUseCase } from './get-transactions.use-case';
import {
  ITransactionRepository,
  TransactionSummary,
} from '@/domain/repositories/transaction.repository';
import { Transaction } from '@/domain/entities/transaction.entity';
import { TransactionType } from '@/domain/enums/transaction-type.enum';
import { RecurrenceType } from '@/domain/enums/recurrence-type.enum';

const mockSummary: TransactionSummary = {
  totalIncome: 5000,
  totalExpense: 1500,
  balance: 3500,
  transactionCount: 10,
};

// Mock do Repositório e de uma transação
const mockTransaction = Transaction.create({
  type: TransactionType.EXPENSE,
  description: 'Test Transaction',
  amount: 100,
  recurrenceType: RecurrenceType.SINGLE,
  cardName: 'card1',
  date: new Date(),
});

const mockTransactionRepository: ITransactionRepository = {
  create: vi.fn(),
  createMany: vi.fn(),
  find: vi.fn().mockResolvedValue([mockTransaction]),
  getSummary: vi.fn(),
  getSummaryByCardNameAndDate: vi.fn().mockResolvedValue(new Map<string, TransactionSummary>([['card1', mockSummary]])),
};

describe('GetTransactionsUseCase', () => {
  it('should call the repository with correct parameters and return transactions', async () => {
    const useCase = new GetTransactionsUseCase(mockTransactionRepository);

    const input = {
      cardName: 'card1',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
    };

    const output = await useCase.execute(input);

    expect(mockTransactionRepository.find).toHaveBeenCalledWith(input);
    expect(output.transactions).toHaveLength(1);
    expect(output.transactions.id).toBe(mockTransaction.id);
    expect(output.transactions.description).toBe('Test Transaction');
    expect(output.transactions.cardName).toBe('card1');
  });

  it('should return an empty array if repository finds no transactions', async () => {
    vi.spyOn(mockTransactionRepository, 'find').mockResolvedValueOnce([]);
    const useCase = new GetTransactionsUseCase(mockTransactionRepository);

    const input = { cardName: 'card-not-found' };
    const output = await useCase.execute(input);

    expect(output.transactions).toHaveLength(0);
  });
});