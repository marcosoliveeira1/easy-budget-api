import { Card } from '@/domain/entities/card.entity';

export interface ICardRepository {
  findByName(name: string): Promise<Card | null>;
}