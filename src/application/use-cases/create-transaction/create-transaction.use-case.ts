import { Transaction } from '@/domain/entities/transaction.entity';
import { RecurrenceType } from '@/domain/enums/recurrence-type.enum';
import { ITransactionRepository } from '@/domain/repositories/transaction.repository';
import {
  CreateTransactionInputDto,
  CreateTransactionOutputDto,
} from './create-transaction.dto';

export class CreateTransactionUseCase {
  constructor(private transactionRepository: ITransactionRepository) { }

  async execute(
    input: CreateTransactionInputDto,
  ): Promise<CreateTransactionOutputDto> {
    if (!input.installments || input.installments <= 1) {
      const transaction = Transaction.create({
        ...input,
        recurrenceType: RecurrenceType.SINGLE,
      });

      const createdTransaction = await this.transactionRepository.create(transaction);
      return { transactions: [createdTransaction] };
    }

    const transactions: Transaction[] = [];
    const baseDate = new Date(input?.date || new Date());
    for (let i = 1; i <= input.installments; i++) {
      const transactionDate = this.addMonthsKeepingLastDay(baseDate, i - 1);

      const installmentTransaction = Transaction.create({
        ...input,
        date: transactionDate,
        recurrenceType: RecurrenceType.INSTALLMENT,
        installmentCurrent: i,
        installmentTotal: input.installments,
      });
      transactions.push(installmentTransaction);
    }

    const createdTransactions = await this.transactionRepository.createMany(transactions);

    return {
      transactions: createdTransactions,
    };
  }

  private addMonthsKeepingLastDay(date: Date, months: number): Date {
    const year = date.getFullYear();
    const month = date.getMonth() + months + 1; // +1 to jump to next month
    const lastDay = new Date(year, month, 0);   // day 0 = last day of prev month
    return lastDay;
  }
}