import { PrismaClient } from '../../../generated/prisma_client';

// Adicionar `log: ['query']` pode ser útil para debug durante o desenvolvimento
export const prisma = new PrismaClient();