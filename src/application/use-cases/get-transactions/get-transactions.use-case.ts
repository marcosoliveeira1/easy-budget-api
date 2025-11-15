import { ITransactionRepository } from '@/domain/repositories/transaction.repository';
import {
  GetTransactionsInputDto,
  GetTransactionsOutputDto,
} from './get-transactions.dto';

export class GetTransactionsUseCase {
  constructor(private transactionRepository: ITransactionRepository) { }

  async execute(
    input: GetTransactionsInputDto,
  ): Promise<GetTransactionsOutputDto> {
    const params = { ...input };

    // Normaliza endDate para o fim do dia (23:59:59.999)
    if (params.endDate) {
      params.endDate = this.endOfDay(params.endDate);
    }

    const transactions = await this.transactionRepository.find(params);

    return {
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        description: t.description,
        amount: t.amount,
        categoryName: t.categoryName,
        cardName: t.cardName,
        date: t.date,
        recurrenceType: t.recurrenceType,
        installmentTotal: t.installmentTotal,
        installmentCurrent: t.installmentCurrent,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    };
  }

  private endOfDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(23, 59, 59, 999);
    return normalized;
  }
}