import { Card } from '@/domain/entities/card.entity';
import { Transaction } from '@/domain/entities/transaction.entity';
import { RecurrenceType } from '@/domain/enums/recurrence-type.enum';
import { ICardRepository } from '@/domain/repositories/card.repository';
import { ReferenceDateCalculator } from '@/domain/services/reference-date-calculator.service';
import { DomainError } from '@/shared/errors/domain-error';

// This DTO is a subset of the UseCase DTO, only with creation data.
export interface TransactionFactoryProps {
  type: 'income' | 'expense';
  description: string;
  amount: number;
  categoryName?: string;
  cardName?: string;
  date?: Date;
  referenceDate?: Date;
  installments?: number;
}

export class TransactionFactory {
  constructor(
    private cardRepository: ICardRepository,
    private referenceDateCalculator: ReferenceDateCalculator,
  ) {}

  public async create(props: TransactionFactoryProps): Promise<Transaction[]> {
    const transactionDate = props.date ?? new Date();
    const card = await this.findCard(props.cardName);
    
    const referenceDate = props.referenceDate ?? (card 
      ? this.referenceDateCalculator.calculate(transactionDate, card) 
      : undefined);

    const baseProps = {
      ...props,
      date: transactionDate,
      cardId: card?.id,
      referenceDate,
    };

    if (!props.installments || props.installments <= 1) {
      return [this.createSingleTransaction(baseProps)];
    }

    return this.createInstallmentTransactions(baseProps, props.installments);
  }

  private async findCard(cardName?: string): Promise<Card | null> {
    if (!cardName) {
      return null;
    }
    const card = await this.cardRepository.findByName(cardName);
    if (!card) {
      throw new DomainError(`Card "${cardName}" not found.`);
    }
    return card;
  }

  private createSingleTransaction(props: Omit<TransactionFactoryProps, 'cardName'> & { cardId?: string }): Transaction {
    return Transaction.create({
      ...props,
      recurrenceType: RecurrenceType.SINGLE,
    });
  }

  private createInstallmentTransactions(
    props: Omit<TransactionFactoryProps, 'cardName'> & { cardId?: string },
    installments: number
  ): Transaction[] {
    const transactions: Transaction[] = [];

    for (let i = 1; i <= installments; i++) {
      const installmentDate = new Date(props.date!);
      installmentDate.setUTCMonth(props.date!.getUTCMonth() + (i - 1));
      
      const installmentReferenceDate = props.referenceDate ? new Date(props.referenceDate) : undefined;
      if (installmentReferenceDate) {
        installmentReferenceDate.setUTCMonth(props.referenceDate.getUTCMonth() + (i - 1));
      }

      const installmentTransaction = Transaction.create({
        ...props,
        date: installmentDate,
        referenceDate: installmentReferenceDate,
        recurrenceType: RecurrenceType.INSTALLMENT,
        installmentCurrent: i,
        installmentTotal: installments,
      });
      transactions.push(installmentTransaction);
    }
    
    return transactions;
  }
}