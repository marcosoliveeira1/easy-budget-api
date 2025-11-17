import { CreateTransactionUseCase } from './application/use-cases/create-transaction/create-transaction.use-case';
import { GetTransactionSummaryUseCase } from './application/use-cases/get-transaction-summary/get-transaction-summary.use-case';
import { GetTransactionsUseCase } from './application/use-cases/get-transactions/get-transactions.use-case';
import { env } from './config';
import { prisma } from './infra/database/prisma';
import { TransactionController } from './infra/http/controllers/transaction.controller';
import { createServer } from './infra/http/server';
import { PrismaTransactionRepository } from './infra/repositories/prisma/prisma-transaction.repository';
import { GetCardSummaryUseCase } from './application/use-cases/get-card-summary/get-card-summary.use-case';
import { PrismaCardRepository } from './infra/repositories/prisma/prisma-card.repository';
import { TransactionFactory } from './domain/factories/transaction.factory';
import { ReferenceDateCalculator } from './domain/services/reference-date-calculator.service';

function log(message: string): void {
  console.log(`[App] ${message}`);
}

async function main() {
  log('Starting application...');


  // Camada de Repositório
  const transactionRepository = new PrismaTransactionRepository(prisma);
  const cardRepository = new PrismaCardRepository(prisma);

  // Camada de Serviços de Domínio e Fábricas
  const referenceDateCalculator = new ReferenceDateCalculator();
  const transactionFactory = new TransactionFactory(
    cardRepository,
    referenceDateCalculator,
  );

  // Camada de Casos de Uso
  const createTransactionUseCase = new CreateTransactionUseCase(
    transactionRepository,
    transactionFactory,
  );
  const getTransactionsUseCase = new GetTransactionsUseCase(
    transactionRepository,
  );
  const getTransactionSummaryUseCase = new GetTransactionSummaryUseCase(
    transactionRepository,
  );
  const getCardSummaryUseCase = new GetCardSummaryUseCase(
    transactionRepository,
  );

  // Camada de Controller
  const transactionController = new TransactionController(
    createTransactionUseCase,
    getTransactionsUseCase,
    getTransactionSummaryUseCase,
    getCardSummaryUseCase,
  );

  // Camada de API (Servidor)
  const app = createServer({
    transactionController,
  });

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    log(`🚀 Server listening on port ${env.PORT}. Docs at /docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();