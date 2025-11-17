import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateTransactionUseCase } from './create-transaction.use-case';
import { ITransactionRepository } from '@/domain/repositories/transaction.repository';
import { TransactionType } from '@/domain/enums/transaction-type.enum';
import { Transaction } from '@/domain/entities/transaction.entity';
import { TransactionFactory } from '@/domain/factories/transaction.factory';

// Mocks
const mockTransactionRepository: ITransactionRepository = {
  create: vi.fn(),
  createMany: vi.fn(),
  find: vi.fn(),
  getSummary: vi.fn(),
  getSummaryByCardNameAndDate: vi.fn(),
};

const mockTransactionFactory: TransactionFactory = {
  create: vi.fn(),
} as any;

const mockSingleTransaction = Transaction.create({
  type: TransactionType.EXPENSE,
  description: 'Single',
  amount: 10,
  recurrenceType: 'single',
});

const mockMultipleTransactions = [
  Transaction.create({
    type: TransactionType.EXPENSE,
    description: 'Installment 1',
    amount: 10,
    recurrenceType: 'installment',
    installmentCurrent: 1,
    installmentTotal: 2,
  }),
  Transaction.create({
    type: TransactionType.EXPENSE,
    description: 'Installment 2',
    amount: 10,
    recurrenceType: 'installment',
    installmentCurrent: 2,
    installmentTotal: 2,
  }),
];

describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new CreateTransactionUseCase(
      mockTransactionRepository,
      mockTransactionFactory,
    );
  });

  it('should call transactionRepository.create when factory returns a single transaction', async () => {
    vi.spyOn(mockTransactionFactory, 'create').mockResolvedValueOnce([
      mockSingleTransaction,
    ]);
    vi.spyOn(mockTransactionRepository, 'create').mockResolvedValueOnce(
      mockSingleTransaction,
    );

    const input = {
      type: TransactionType.EXPENSE,
      description: 'Single',
      amount: 10,
    };

    const output = await useCase.execute(input);

    expect(mockTransactionFactory.create).toHaveBeenCalledWith(input);
    expect(mockTransactionRepository.create).toHaveBeenCalledWith(
      mockSingleTransaction,
    );
    expect(mockTransactionRepository.createMany).not.toHaveBeenCalled();
    expect(output.transactions).toEqual([mockSingleTransaction]);
  });

  it('should call transactionRepository.createMany when factory returns multiple transactions', async () => {
    vi.spyOn(mockTransactionFactory, 'create').mockResolvedValueOnce(
      mockMultipleTransactions,
    );
    vi.spyOn(mockTransactionRepository, 'createMany').mockResolvedValueOnce(
      mockMultipleTransactions,
    );

    const input = {
      type: TransactionType.EXPENSE,
      description: 'Installments',
      amount: 20,
      installments: 2,
    };

    const output = await useCase.execute(input);

    expect(mockTransactionFactory.create).toHaveBeenCalledWith(input);
    expect(mockTransactionRepository.createMany).toHaveBeenCalledWith(
      mockMultipleTransactions,
    );
    expect(mockTransactionRepository.create).not.toHaveBeenCalled();
    expect(output.transactions).toEqual(mockMultipleTransactions);
  });
});