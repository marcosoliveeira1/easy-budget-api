import { describe, it, expect, vi } from 'vitest';
import { GetCardSummaryUseCase } from './get-card-summary.use-case';
import {
  ITransactionRepository, TransactionSummary
} from '@/domain/repositories/transaction.repository';
import { DomainError } from '@/shared/errors/domain-error';

// Mock
const mockSummary: TransactionSummary = {
  totalIncome: 5000,
  totalExpense: 1500,
  balance: 3500,
  transactionCount: 10,
};

const mockTransactionRepository: ITransactionRepository = {
  create: vi.fn(),
  createMany: vi.fn(),
  find: vi.fn(),
  getSummary: vi.fn().mockResolvedValue(mockSummary),
  getSummaryByCardNameAndDate: vi.fn().mockResolvedValue(new Map<string, TransactionSummary>([['card1', mockSummary]])),
};

describe('GetCardSummaryUseCase', () => {
  it('should return a transaction summary', async () => {
    const useCase = new GetCardSummaryUseCase(mockTransactionRepository);
    const input = {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
      cardName: 'card1',
    };

    const output = await useCase.execute(input);

    expect(mockTransactionRepository.getSummaryByCardNameAndDate).toHaveBeenCalledWith(input);
    expect(output).toEqual(mockSummary);
  });

  it('should throw a DomainError if end date is before start date', async () => {
    const useCase = new GetCardSummaryUseCase(mockTransactionRepository);
    const input = {
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-01-31'),
    };

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
    await expect(useCase.execute(input)).rejects.toThrow(
      'End date cannot be earlier than start date.',
    );
  });
});