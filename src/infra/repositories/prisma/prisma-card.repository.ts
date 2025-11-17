import { prisma } from '@/infra/database/prisma';
import { Card } from '@/domain/entities/card.entity';
import { ICardRepository } from '@/domain/repositories/card.repository';

const toDomain = (prismaCard: prisma.Card): Card => {
  return Card.create({
    id: prismaCard.id,
    name: prismaCard.name,
    closingDay: prismaCard.closingDay,
    dueDay: prismaCard.dueDay,
  });
};

export class PrismaCardRepository implements ICardRepository {
  constructor(private prisma: PrismaClient) { }

  async findByName(name: string): Promise<Card | null> {
    const card = await this.prisma.card.findUnique({
      where: { name },
    });

    return card ? toDomain(card) : null;
  }
}