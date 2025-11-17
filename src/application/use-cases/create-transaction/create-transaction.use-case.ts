import { ITransactionRepository } from '@/domain/repositories/transaction.repository';
import { TransactionFactory } from '@/domain/factories/transaction.factory';
import {
  CreateTransactionInputDto,
  CreateTransactionOutputDto,
} from './create-transaction.dto';

export class CreateTransactionUseCase {
  constructor(
    private transactionRepository: ITransactionRepository,
    private transactionFactory: TransactionFactory,
  ) { }

  async execute(
    input: CreateTransactionInputDto,
  ): Promise<CreateTransactionOutputDto> {
    // 1. Use the factory to create the domain entity/entities
    const transactionsToCreate = await this.transactionFactory.create(input);

    // 2. Persist the entities
    if (transactionsToCreate.length === 1) {
      const createdTransaction = await this.transactionRepository.create(
        transactionsToCreate[0],
      );
      return { transactions: [createdTransaction] };
    }

    const createdTransactions = await this.transactionRepository.createMany(
      transactionsToCreate,
    );

    return {
      transactions: createdTransactions,
    };
  }
}