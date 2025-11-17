export interface CardProps {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
}

export class Card {
  private _id: string;
  private props: Omit<CardProps, 'id'>;

  private constructor(props: CardProps) {
    this._id = props.id;
    this.props = props;
  }

  public static create(props: CardProps): Card {
    return new Card(props);
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this.props.name;
  }

  get closingDay(): number {
    return this.props.closingDay;
  }

  get dueDay(): number {
    return this.props.dueDay;
  }
}