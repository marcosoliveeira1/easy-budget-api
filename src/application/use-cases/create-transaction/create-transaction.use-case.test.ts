import { afterEach, describe, it, expect, vi } from 'vitest';
import { CreateTransactionUseCase } from './create-transaction.use-case';
import { ITransactionRepository } from '@/domain/repositories/transaction.repository';
import { TransactionType } from '@/domain/enums/transaction-type.enum';
import { Transaction } from '@/domain/entities/transaction.entity';

// Mock do Repositório
const mockTransactionRepository: ITransactionRepository = {
    create: vi.fn(),
    createMany: vi.fn(),
    find: vi.fn(),
    getSummary: vi.fn(),
};

describe('CreateTransactionUseCase', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create a single transaction', async () => {
        const useCase = new CreateTransactionUseCase(mockTransactionRepository);

        const input = {
            type: TransactionType.EXPENSE,
            description: 'Almoço',
            amount: 25.5
        };

        const output = await useCase.execute(input);

        expect(output.transactions).toHaveLength(1);
        expect(mockTransactionRepository.create).toHaveBeenCalledTimes(1);
        expect(mockTransactionRepository.createMany).not.toHaveBeenCalled();
        const createdTransaction = (mockTransactionRepository.create as any).mock
            .calls as Transaction[0];
        expect(createdTransaction[0].description).toBe('Almoço');
        expect(createdTransaction[0].installmentTotal).toBe(1);
    });

    it('should create multiple transactions for an installment purchase', async () => {
        const useCase = new CreateTransactionUseCase(mockTransactionRepository);

        const input = {
            type: TransactionType.EXPENSE,
            description: 'Celular novo',
            amount: 500,
            categoryName: 'cat2',
            cardName: 'card2',
            date: new Date('2025-01-15T03:00:00.000Z'), // Usar UTC para evitar issues com timezone
            installments: 3,
        };

        const { transactions } = await useCase.execute(input);
        // expect(output.transactions).toHaveLength(3); // @fix later
        expect(mockTransactionRepository.createMany).toHaveBeenCalledTimes(1);
        expect(mockTransactionRepository.create).not.toHaveBeenCalled();


        expect(transactions).toHaveLength(3);
        console.log({ transactions });
        // Primeira parcela
        expect(transactions[0].description).toBe('Celular novo');
        expect(transactions[0].installmentCurrent).toBe(1);
        expect(transactions[0].installmentTotal).toBe(3);
        expect(transactions[0].date.getUTCMonth()).toBe(0); // Janeiro
        expect(transactions[0].date.getUTCDate()).toBe(15);

        // Segunda parcela
        expect(transactions[1].installmentCurrent).toBe(2);
        expect(transactions[1].date.getUTCMonth()).toBe(1); // Fevereiro
        expect(transactions[1].date.getUTCDate()).toBe(15);

        // Terceira parcela
        expect(transactions[2].installmentCurrent).toBe(3);
        expect(transactions[2].date.getUTCMonth()).toBe(2); // Março
        expect(transactions[2].date.getUTCDate()).toBe(15);
    });
});