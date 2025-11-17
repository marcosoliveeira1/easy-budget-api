import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionFactory } from './transaction.factory';
import { ICardRepository } from '@/domain/repositories/card.repository';
import { ReferenceDateCalculator } from '@/domain/services/reference-date-calculator.service';
import { Card } from '@/domain/entities/card.entity';
import { TransactionType } from '@/domain/enums/transaction-type.enum';
import { RecurrenceType } from '@/domain/enums/recurrence-type.enum';
import { DomainError } from '@/shared/errors/domain-error';

const mockCard = Card.create({
  id: 'card-id-1',
  name: 'Nubank',
  closingDay: 20,
  dueDay: 28,
});

const mockCardRepository: ICardRepository = {
  findByName: vi.fn(),
};

const mockReferenceDateCalculator: ReferenceDateCalculator = {
  calculate: vi.fn(),
};

describe('TransactionFactory', () => {
  let factory: TransactionFactory;

  beforeEach(() => {
    vi.clearAllMocks();
    factory = new TransactionFactory(
      mockCardRepository,
      mockReferenceDateCalculator,
    );
  });

  it('should create a single transaction when no installments are provided', async () => {
    const input = {
      type: TransactionType.EXPENSE,
      description: 'Single Purchase',
      amount: 100,
    };

    const transactions = await factory.create(input);

    expect(transactions).toHaveLength(1);
    const [transaction] = transactions;
    expect(transaction.description).toBe('Single Purchase');
    expect(transaction.recurrenceType).toBe(RecurrenceType.SINGLE);
    expect(mockCardRepository.findByName).not.toHaveBeenCalled();
    expect(mockReferenceDateCalculator.calculate).not.toHaveBeenCalled();
  });

  it('should throw a DomainError if the card is not found', async () => {
    vi.spyOn(mockCardRepository, 'findByName').mockResolvedValueOnce(null);
    const input = {
      type: TransactionType.EXPENSE,
      description: 'Purchase on ghost card',
      amount: 50,
      cardName: 'Ghost Card',
    };

    await expect(factory.create(input)).rejects.toThrow(DomainError);
    await expect(factory.create(input)).rejects.toThrow('Card "Ghost Card" not found.');
  });

  it('should calculate referenceDate for a card transaction when not provided', async () => {
    const transactionDate = new Date('2025-11-25T00:00:00Z');
    const calculatedRefDate = new Date('2025-12-01T00:00:00Z');
    vi.spyOn(mockCardRepository, 'findByName').mockResolvedValueOnce(mockCard);
    vi.spyOn(mockReferenceDateCalculator, 'calculate').mockReturnValueOnce(calculatedRefDate);

    const input = {
      type: TransactionType.EXPENSE,
      description: 'Post-closing day purchase',
      amount: 150,
      cardName: 'Nubank',
      date: transactionDate,
    };

    const transactions = await factory.create(input);

    expect(transactions).toHaveLength(1);
    expect(mockCardRepository.findByName).toHaveBeenCalledWith('Nubank');
    expect(mockReferenceDateCalculator.calculate).toHaveBeenCalledWith(transactionDate, mockCard);
    expect(transactions[0].referenceDate).toEqual(calculatedRefDate);
    expect(transactions[0].cardId).toBe(mockCard.id);
  });

  it('should use the provided referenceDate instead of calculating it', async () => {
    const providedRefDate = new Date('2025-10-01T00:00:00Z');
    vi.spyOn(mockCardRepository, 'findByName').mockResolvedValueOnce(mockCard);

    const input = {
      type: TransactionType.EXPENSE,
      description: 'Manual reference date',
      amount: 99,
      cardName: 'Nubank',
      referenceDate: providedRefDate,
    };

    const transactions = await factory.create(input);

    expect(transactions[0].referenceDate).toEqual(providedRefDate);
    expect(mockReferenceDateCalculator.calculate).not.toHaveBeenCalled();
  });

  it('should create multiple transactions for an installment purchase', async () => {
    const transactionDate = new Date('2025-01-10T00:00:00Z'); // Before closing day
    const referenceDate = new Date('2025-01-01T00:00:00Z');
    vi.spyOn(mockCardRepository, 'findByName').mockResolvedValue(mockCard);
    vi.spyOn(mockReferenceDateCalculator, 'calculate').mockReturnValue(referenceDate);

    const input = {
      type: TransactionType.EXPENSE,
      description: 'Big Purchase',
      amount: 300,
      cardName: 'Nubank',
      date: transactionDate,
      installments: 3,
    };

    const transactions = await factory.create(input);

    expect(transactions).toHaveLength(3);

    // Installment 1
    expect(transactions[0].installmentCurrent).toBe(1);
    expect(transactions[0].installmentTotal).toBe(3);
    expect(transactions[0].date.toISOString()).toBe('2025-01-10T00:00:00.000Z');
    expect(transactions[0].referenceDate?.toISOString()).toBe('2025-01-01T00:00:00.000Z');

    // Installment 2
    expect(transactions[1].installmentCurrent).toBe(2);
    expect(transactions[1].date.toISOString()).toBe('2025-02-10T00:00:00.000Z');
    expect(transactions[1].referenceDate?.toISOString()).toBe('2025-02-01T00:00:00.000Z');

    // Installment 3
    expect(transactions[2].installmentCurrent).toBe(3);
    expect(transactions[2].date.toISOString()).toBe('2025-03-10T00:00:00.000Z');
    expect(transactions[2].referenceDate?.toISOString()).toBe('2025-03-01T00:00:00.000Z');
  });
});