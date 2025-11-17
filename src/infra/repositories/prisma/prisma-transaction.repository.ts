import {
  PrismaClient,
  Transaction as PrismaTransaction,
  Card as PrismaCard,
} from '@prisma/client';
import { Transaction } from '@/domain/entities/transaction.entity';
import {
  FindTransactionsParams,
  GetSummaryParams,
  ITransactionRepository,
  TransactionSummary,
} from '@/domain/repositories/transaction.repository';
import { TransactionType } from '@/domain/enums/transaction-type.enum';
import { RecurrenceType } from '@/domain/enums/recurrence-type.enum';

type PrismaTransactionWithCard = PrismaTransaction & { card?: PrismaCard | null };

const toDomain = (prismaTransaction: PrismaTransactionWithCard): Transaction => {
  return Transaction.create({
    id: prismaTransaction.id,
    type: prismaTransaction.type.toLowerCase() as TransactionType,
    description: prismaTransaction.description,
    amount: prismaTransaction.amountCents / 100,
    categoryName: prismaTransaction.categoryName ?? undefined,
    cardId: prismaTransaction.cardId ?? undefined,
    cardName: prismaTransaction.card?.name ?? undefined,
    date: prismaTransaction.date,
    referenceDate: prismaTransaction.referenceDate ?? undefined,
    recurrenceType:
      prismaTransaction.recurrenceType.toLowerCase() as RecurrenceType,
    installmentTotal: prismaTransaction.installmentTotal ?? undefined,
    installmentCurrent: prismaTransaction.installmentCurrent ?? undefined,
    createdAt: prismaTransaction.createdAt,
    updatedAt: prismaTransaction.updatedAt,
  });
};

export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(private prisma: PrismaClient) { }

  async create(transaction: Transaction): Promise<Transaction> {
    const createdTransaction = await this.prisma.transaction.create({
      data: {
        id: transaction.id,
        type: transaction.type.toUpperCase() as any,
        description: transaction.description,
        amountCents: Math.round(transaction.amount * 100),
        categoryName: transaction.categoryName,
        cardId: transaction.cardId,
        date: transaction.date,
        referenceDate: transaction.referenceDate,
        recurrenceType: transaction.recurrenceType.toUpperCase() as any,
        installmentTotal: transaction.installmentTotal,
        installmentCurrent: transaction.installmentCurrent,
      },
    });
    return toDomain(createdTransaction);
  }

  async createMany(transactions: Transaction[]): Promise<Transaction[]> {
    const data = transactions.map((t) => ({
      id: t.id,
      type: t.type.toUpperCase() as any,
      description: t.description,
      amountCents: Math.round(t.amount * 100),
      categoryName: t.categoryName,
      cardId: t.cardId,
      date: t.date,
      referenceDate: t.referenceDate,
      recurrenceType: t.recurrenceType.toUpperCase() as any,
      installmentTotal: t.installmentTotal,
      installmentCurrent: t.installmentCurrent,
    }));
    const createdTransactions = await this.prisma.transaction.createManyAndReturn({ data });

    return createdTransactions.map(toDomain);
  }

  async find(params: FindTransactionsParams): Promise<Transaction[]> {
    const where: any = {};
    if (params.cardId) {
      where.cardId = params.cardId;
    }

    // Lógica para filtrar por data de referência (fatura) ou data da transação
    if (params.startDate && params.endDate) {
      where.OR = [
        { referenceDate: { gte: params.startDate, lte: params.endDate } },
        { referenceDate: null, date: { gte: params.startDate, lte: params.endDate } },
      ];
    }

    const prismaTransactions = await this.prisma.transaction.findMany({
      where,
      include: {
        card: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return prismaTransactions.map(toDomain);
  }

  async getSummary(params: GetSummaryParams): Promise<TransactionSummary> {
    const where: any = {};
    if (params.cardId) {
      where.cardId = params.cardId;
    }

    // Lógica para filtrar por data de referência (fatura) ou data da transação
    if (params.startDate && params.endDate) {
      where.OR = [
        { referenceDate: { gte: params.startDate, lte: params.endDate } },
        { referenceDate: null, date: { gte: params.startDate, lte: params.endDate } },
      ];
    }

    const aggregations = await this.prisma.transaction.aggregate({
      where,
      _sum: {
        amountCents: true,
      },
      _count: {
        id: true,
      },
    });

    const incomeAggregation = await this.prisma.transaction.aggregate({
      where: { ...where, type: 'INCOME' },
      _sum: {
        amountCents: true,
      },
    });

    const expenseAggregation = await this.prisma.transaction.aggregate({
      where: { ...where, type: 'EXPENSE' },
      _sum: {
        amountCents: true,
      },
    });

    const totalIncome = incomeAggregation._sum.amountCents || 0;
    const totalExpense = expenseAggregation._sum.amountCents || 0;

    return {
      totalIncome: totalIncome > 0 ? totalIncome / 100 : 0,
      totalExpense: totalExpense > 0 ? totalExpense / 100 : 0,
      balance: (totalIncome - totalExpense) / 100,
      transactionCount: aggregations._count.id,
    };
  }

  async getSummaryByCardNameAndDate(params: GetSummaryParams): Promise<Record<string, TransactionSummary>> {
    const where: any = {
      cardId: { not: null },
      OR: [
        { referenceDate: { gte: params.startDate, lte: params.endDate } },
        { referenceDate: null, date: { gte: params.startDate, lte: params.endDate } },
      ]
    };

    if (params.cardId) {
      where.cardId = params.cardId;
    }

    const groupedData = await this.prisma.transaction.groupBy({
      by: ['cardId', 'type'],
      where,
      _sum: {
        amountCents: true,
      },
      _count: {
        id: true,
      },
    });

    if (groupedData.length === 0) return {};

    const cardIds = groupedData.map(g => g.cardId).filter((id): id is string => id !== null);
    const cards = await this.prisma.card.findMany({ where: { id: { in: cardIds } } });
    const cardIdToNameMap = new Map(cards.map(c => [c.id, c.name]));

    const summary: Record<string, TransactionSummary> = {};

    for (const group of groupedData) {
      const cardName = cardIdToNameMap.get(group.cardId as string);
      if (!cardName) continue;

      const type = group.type;
      const amountCents = group._sum.amountCents || 0;
      const count = group._count.id;

      if (!summary.hasOwnProperty(cardName)) {
        summary[cardName] = {
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          transactionCount: 0,
        };
      }

      const summaryEntry = summary[cardName]!;

      if (type === 'INCOME') {
        summaryEntry.totalIncome += amountCents > 0 ? amountCents / 100 : 0;
      } else if (type === 'EXPENSE') {
        summaryEntry.totalExpense += amountCents > 0 ? amountCents / 100 : 0;
      }

      summaryEntry.balance = summaryEntry.totalIncome - summaryEntry.totalExpense;
      summaryEntry.transactionCount += count;
    }

    return summary;
  }
}