import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { TransactionController } from '../controllers/transaction.controller';
import {
  createTransactionBodySchema,
  getTransactionsQuerySchema,
  transactionSchema,
  transactionSummaryQuerySchema,
} from '../schemas/transaction.schemas';

export async function transactionRoutes(
  app: FastifyInstance,
  controller: TransactionController,
) {
  app.post(
    '/transactions',
    {
      schema: {
        tags: ['Transactions'],
        summary: 'Create a new transaction',
        body: createTransactionBodySchema,
        response: {
          201: z.object({
            transactions: z.array(transactionSchema),
          }),
        },
      },
    },
    controller.create.bind(controller),
  );

  app.get(
    '/transactions',
    {
      schema: {
        tags: ['Transactions'],
        summary: 'Get transactions by period or card',
        querystring: getTransactionsQuerySchema,
        response: {
          200: z.object({
            transactions: z.array(transactionSchema),
          }),
        },
      },
    },
    controller.list.bind(controller),
  );

  app.get(
    '/transactions/summary',
    {
      schema: {
        tags: ['Transactions'],
        summary: 'Get transaction summary by period and card',
        querystring: transactionSummaryQuerySchema,
        response: {
          200: z.object({
            totalIncome: z.number(),
            totalExpense: z.number(),
            balance: z.number(),
            transactionCount: z.number(),
          }),
        },
      },
    },
    controller.summary.bind(controller),
  );

  app.get(
    '/transactions/card/summary',
    {
      schema: {
        tags: ['Transactions'],
        summary: 'Get transaction summary by period and card',
        querystring: transactionSummaryQuerySchema,
        response: {
          200: z.record(
            z.string(),
            z.object({
              totalIncome: z.number(),
              totalExpense: z.number(),
              balance: z.number(),
              transactionCount: z.number(),
            })
          ),
        },
      },
    },
    controller.cardSummary.bind(controller),
  );
}