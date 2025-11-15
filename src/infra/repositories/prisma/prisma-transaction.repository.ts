import { PrismaClient, Transaction as PrismaTransaction } from '@prisma/client';
import { Transaction } from '@/domain/entities/transaction.entity';
import {
  FindTransactionsParams,
  GetSummaryParams,
  ITransactionRepository,
  TransactionSummary,
} from '@/domain/repositories/transaction.repository';
import { TransactionType } from '@/domain/enums/transaction-type.enum';
import { RecurrenceType } from '@/domain/enums/recurrence-type.enum';

const toDomain = (prismaTransaction: PrismaTransaction): Transaction => {
  return Transaction.create({
    id: prismaTransaction.id,
    type: prismaTransaction.type.toLowerCase() as TransactionType,
    description: prismaTransaction.description,
    amount: prismaTransaction.amountCents / 100,
    categoryName: prismaTransaction.categoryName ?? undefined,
    cardName: prismaTransaction.cardName ?? undefined,
    date: prismaTransaction.date,
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
        cardName: transaction.cardName,
        date: transaction.date,
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
      cardName: t.cardName,
      date: t.date,
      recurrenceType: t.recurrenceType.toUpperCase() as any,
      installmentTotal: t.installmentTotal,
      installmentCurrent: t.installmentCurrent,
    }));
    const createdTransactions = await this.prisma.transaction.createManyAndReturn({ data });

    return createdTransactions.map(toDomain);
  }

  async find(params: FindTransactionsParams): Promise<Transaction[]> {
    const where: any = {};
    if (params.cardName) {
      where.cardName = params.cardName;
    }
    if (params.startDate && params.endDate) {
      where.date = {
        gte: params.startDate,
        lte: params.endDate,
      };
    }

    const prismaTransactions = await this.prisma.transaction.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
    });

    return prismaTransactions.map(toDomain);
  }

  async getSummary(params: GetSummaryParams): Promise<TransactionSummary> {
    const where: any = {
      date: {
        gte: params.startDate,
        lte: params.endDate,
      },
    };
    if (params.cardName) {
      where.cardName = params.cardName;
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
      date: {
        gte: params.startDate,
        lte: params.endDate,
      },
      cardName: { not: null }
    };

    if (params.cardName) {
      where.cardName = params.cardName;
    }

    const groupedData = await this.prisma.transaction.groupBy({
      by: ['cardName', 'type'],
      where,
      _sum: {
        amountCents: true,
      },
      _count: {
        id: true,
      },
    });

    const summary: Record<string, TransactionSummary> = {};

    for (const group of groupedData) {
      const cardName = group.cardName as string;
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