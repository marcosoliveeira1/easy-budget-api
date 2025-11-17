import { TransactionSummary } from "@/domain/repositories/transaction.repository";

export interface GetCardSummaryInputDto {
  startDate: Date;
  endDate: Date;
  cardId?: string;
}

export type GetCardSummaryOutputDto = Record<string, TransactionSummary>;