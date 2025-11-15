import { z } from 'zod';
import { TransactionType } from '@/domain/enums/transaction-type.enum';
import { RecurrenceType } from '@/domain/enums/recurrence-type.enum';

// Custom date parser que interpreta a string como data local (não UTC)
const localDateString = z.string().transform((val) => {
  // Adiciona 'T00:00:00' para forçar interpretação como local
  // Isso evita que o Date() interprete como UTC
  const [year, month, day] = val.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
});

export const transactionSchema = z.object({
  id: z.string(),
  type: z.enum(TransactionType),
  description: z.string(),
  amount: z.number(),
  date: z.date(),
  recurrenceType: z.enum(RecurrenceType),
  installmentTotal: z.number().int().optional().nullable(),
  installmentCurrent: z.number().int().optional().nullable(),
  categoryName: z.string().optional().nullable(),
  cardName: z.string().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createTransactionBodySchema = z.object({
  type: z.optional(z.enum(TransactionType)).default(TransactionType.EXPENSE),
  description: z.string().min(1),
  amount: z.number().positive(),
  categoryName: z.string().optional(),
  cardName: z.string().optional(),
  date: z.coerce.date().optional(),
  installments: z.number().int().positive().optional(),
});

export const getTransactionsQuerySchema = z.object({
  cardName: z.string().optional(),
  startDate: localDateString.optional(),
  endDate: localDateString.optional(),
});

export const transactionSummaryQuerySchema = z.object({
  startDate: localDateString,
  endDate: localDateString,
  cardName: z.string().optional(),
});