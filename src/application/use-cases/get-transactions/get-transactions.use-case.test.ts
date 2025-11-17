import { describe, it, expect, vi } from 'vitest';
import { GetTransactionsUseCase } from './get-transactions.use-case';
import {
  ITransactionRepository,
} from '@/domain/repositories/transaction.repository';
import { Transaction } from '@/domain/entities/transaction.entity';
import { TransactionType } from '@/domain/enums/transaction-type.enum';
import { RecurrenceType } from '@/domain/enums/recurrence-type.enum';

// Mock do Repositório e de uma transação
const mockTransaction = Transaction.create({
  type: TransactionType.EXPENSE,
  description: 'Test Transaction',
  amount: 100,
  recurrenceType: RecurrenceType.SINGLE,
  cardId: 'card-id-1',
  cardName: 'card1',
  date: new Date(),
});

const mockTransactionRepository: ITransactionRepository = {
  create: vi.fn(),
  createMany: vi.fn(),
  find: vi.fn().mockResolvedValue([mockTransaction]),
  getSummary: vi.fn(),
  getSummaryByCardNameAndDate: vi.fn(),
};

describe('GetTransactionsUseCase', () => {
  it('should call the repository with correct parameters and return transactions', async () => {
    const useCase = new GetTransactionsUseCase(mockTransactionRepository);

    const input = {
      cardId: 'card-id-1',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
    };

    const output = await useCase.execute(input);

    const expectedEndDate = new Date(input.endDate);
    expectedEndDate.setHours(23, 59, 59, 999);

    expect(mockTransactionRepository.find).toHaveBeenCalledWith({
      ...input,
      endDate: expectedEndDate,
    });

    expect(output.transactions).toHaveLength(1);
    const [transaction] = output.transactions;
    expect(transaction.description).toBe('Test Transaction');
    expect(transaction.cardName).toBe('card1');
  });

  it('should return an empty array if repository finds no transactions', async () => {
    vi.spyOn(mockTransactionRepository, 'find').mockResolvedValueOnce([]);
    const useCase = new GetTransactionsUseCase(mockTransactionRepository);

    const input = { cardId: 'card-not-found' };
    const output = await useCase.execute(input);

    expect(output.transactions).toHaveLength(0);
  });
});