import { TransactionSummary } from "@/domain/repositories/transaction.repository";

export interface GetCardSummaryInputDto {
  startDate: Date;
  endDate: Date;
  cardName?: string;
}

export type GetCardSummaryOutputDto = Record<string, TransactionSummary>;