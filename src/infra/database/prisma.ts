import { PrismaClient } from '@prisma/client';

// Adicionar `log: ['query']` pode ser útil para debug durante o desenvolvimento
export const prisma = new PrismaClient();