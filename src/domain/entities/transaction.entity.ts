import { v7 as uuidv7 } from 'uuid';
import { DomainError } from '@/shared/errors/domain-error';
import { RecurrenceType } from '../enums/recurrence-type.enum';
import { TransactionType } from '../enums/transaction-type.enum';

export interface CreateTransactionProps {
  id?: string;
  type: TransactionType;
  description: string;
  amount: number;
  categoryName?: string;
  cardId?: string;
  cardName?: string;
  date?: Date;
  referenceDate?: Date;
  recurrenceType: RecurrenceType;
  installmentTotal?: number;
  installmentCurrent?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TransactionProps extends CreateTransactionProps {
  date: Date;
}

export class Transaction {
  private _id: string;
  private props: Omit<TransactionProps, 'id'>;

  private constructor(props: TransactionProps) {
    this._id = props.id || uuidv7();
    this.props = {
      ...props,
      amount: Math.abs(props.amount),
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
    };
  }

  public static create(props: CreateTransactionProps): Transaction {
    this.validate(props);

    if (props.recurrenceType === RecurrenceType.SINGLE) {
      props.installmentTotal = 1;
      props.installmentCurrent = 1;
    }

    if (props.date === undefined) {
      props.date = new Date();
    }

    return new Transaction(props as TransactionProps);
  }

  private static validate(props: CreateTransactionProps): void {
    const errors: string[] = [];
    if (!props.description || props.description.trim().length === 0) {
      errors.push('Description is required.');
    }
    if (props.amount <= 0) {
      errors.push('Amount must be greater than zero.');
    }
    if (props.recurrenceType === RecurrenceType.INSTALLMENT) {
      if (!props.installmentTotal || props.installmentTotal <= 1) {
        errors.push(
          'Installment total must be greater than 1 for installment transactions.',
        );
      } else if (
        !props.installmentCurrent ||
        props.installmentCurrent < 1 ||
        props.installmentCurrent > props.installmentTotal
      ) {
        errors.push(
          'Installment current must be a positive number and less than or equal to the total.',
        );
      }
    }

    if (errors.length > 0) {
      throw new DomainError(errors.join(' '));
    }
  }

  get id(): string {
    return this._id;
  }
  get type(): TransactionType {
    return this.props.type;
  }
  get description(): string {
    return this.props.description;
  }
  get amount(): number {
    return this.props.amount;
  }
  get categoryName(): string | undefined {
    return this.props.categoryName;
  }
  get cardId(): string | undefined {
    return this.props.cardId;
  }
  get cardName(): string | undefined {
    return this.props.cardName;
  }
  get date(): Date {
    return this.props.date;
  }
  get referenceDate(): Date | undefined {
    return this.props.referenceDate;
  }
  get recurrenceType(): RecurrenceType {
    return this.props.recurrenceType;
  }
  get installmentTotal(): number | undefined {
    return this.props.installmentTotal;
  }
  get installmentCurrent(): number | undefined {
    return this.props.installmentCurrent;
  }
  get createdAt(): Date {
    return this.props.createdAt!;
  }
  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  public isExpense(): boolean {
    return this.props.type === TransactionType.EXPENSE;
  }

  public isIncome(): boolean {
    return this.props.type === TransactionType.INCOME;
  }
}