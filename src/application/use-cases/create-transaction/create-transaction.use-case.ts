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
    for (let i = 1; i <= input.installments; i++) {
      const transactionDate = new Date(input?.date || new Date());
      transactionDate.setMonth(transactionDate.getMonth() + (i - 1));

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
}