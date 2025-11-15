import { DomainError } from '@/shared/errors/domain-error';
import { ITransactionRepository } from '@/domain/repositories/transaction.repository';
import {
  GetCardSummaryInputDto,
  GetCardSummaryOutputDto,
} from './get-card-summary.dto';

export class GetCardSummaryUseCase {
  constructor(private transactionRepository: ITransactionRepository) { }

  async execute(
    input: GetCardSummaryInputDto,
  ): Promise<GetCardSummaryOutputDto> {
    const params = { ...input };

    // Normaliza endDate para o fim do dia (23:59:59.999)
    params.endDate = this.endOfDay(params.endDate);

    if (params.endDate < params.startDate) {
      throw new DomainError('End date cannot be earlier than start date.');
    }

    const summary = await this.transactionRepository.getSummaryByCardNameAndDate(params);

    return summary;
  }

  private endOfDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(23, 59, 59, 999);
    return normalized;
  }
}