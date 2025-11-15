import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { CreateTransactionUseCase } from '@/application/use-cases/create-transaction/create-transaction.use-case';
import { GetTransactionsUseCase } from '@/application/use-cases/get-transactions/get-transactions.use-case';
import { GetTransactionSummaryUseCase } from '@/application/use-cases/get-transaction-summary/get-transaction-summary.use-case';
import { GetCardSummaryUseCase } from '@/application/use-cases/get-card-summary/get-card-summary.use-case';
import {
  createTransactionBodySchema,
  getTransactionsQuerySchema,
  transactionSummaryQuerySchema,
} from '../schemas/transaction.schemas';

export class TransactionController {
  constructor(
    private createTransactionUseCase: CreateTransactionUseCase,
    private getTransactionsUseCase: GetTransactionsUseCase,
    private getTransactionSummaryUseCase: GetTransactionSummaryUseCase,
    private getCardSummaryUseCase: GetCardSummaryUseCase,
  ) { }

  async create(
    request: FastifyRequest<{ Body: z.infer<typeof createTransactionBodySchema> }>,
    reply: FastifyReply,
  ) {
    const output = await this.createTransactionUseCase.execute(request.body);
    return reply.status(201).send(output);
  }

  async list(
    request: FastifyRequest<{ Querystring: z.infer<typeof getTransactionsQuerySchema> }>,
    reply: FastifyReply,
  ) {
    const output = await this.getTransactionsUseCase.execute(request.query);
    return reply.status(200).send(output);
  }

  async summary(
    request: FastifyRequest<{ Querystring: z.infer<typeof transactionSummaryQuerySchema> }>,
    reply: FastifyReply,
  ) {
    const output = await this.getTransactionSummaryUseCase.execute(
      request.query,
    );
    return reply.status(200).send(output);
  }

  async cardSummary(
    request: FastifyRequest<{ Querystring: z.infer<typeof transactionSummaryQuerySchema> }>,
    reply: FastifyReply,
  ) {
    const output = await this.getCardSummaryUseCase.execute(
      request.query,
    );
    return reply.status(200).send(output);
  }
}