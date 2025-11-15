import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastify, { FastifyError, FastifySchemaValidationError } from 'fastify';
import {
  jsonSchemaTransform,
  ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { z } from 'zod';
import { DomainError } from '@/shared/errors/domain-error';
import { env } from '@/config';
import { transactionRoutes } from './routes/transaction.routes';
import { TransactionController } from './controllers/transaction.controller';

interface AppDependencies {
  transactionController: TransactionController;
}

export function createServer(dependencies: AppDependencies) {
  const app = fastify({
    logger: env.NODE_ENV === 'dev',
  }).withTypeProvider<ZodTypeProvider>();

  // Adiciona os schemas do Zod ao compilador do Fastify
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Configuração do Swagger
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Financial Core API',
        description: 'API for managing financial transactions.',
        version: '1.0.0',
      },
    },
    transform: jsonSchemaTransform,
  });

  app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });

  app.register(
    async (app) => transactionRoutes(app, dependencies.transactionController),
    {
      prefix: '/v1',
    },
  );

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({
        message: 'Validation error.',
        issues: error.format(),
      });
    }

    if ((error as FastifyError).validation) {
      const validationError = error as any;
      const context = validationError.validationContext || 'body';

      const errors = validationError.validation?.map((err: any) => {
        const field = err.instancePath?.replace(/^\//, '') || 'unknown';

        let message = err.message || 'Invalid value';

        if (message.includes('expected string, received undefined')) {
          message = 'This field is required';
        } else if (message.includes('Invalid input')) {
          message = message.replace('Invalid input: ', '');
        }

        return {
          field,
          message,
          location: context,
        };
      }) || [];

      return reply.status(400).send({
        message: `Validation error in ${context}.`,
        errors,
      });
    }

    if (error instanceof DomainError) {
      return reply.status(400).send({
        message: error.message,
      });
    }

    if (env.NODE_ENV !== 'production') {
      console.error(error);
    } else {
      // TODO: Log to an external tool like Sentry/DataDog
    }

    return reply.status(500).send({ message: 'Internal server error.' });
  });

  return app;
}