-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "recurrence_type" AS ENUM ('SINGLE', 'INSTALLMENT', 'RECURRING');

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "type" "transaction_type" NOT NULL,
    "description" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "category_name" TEXT,
    "card_name" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "recurrence_type" "recurrence_type" NOT NULL,
    "installment_total" INTEGER,
    "installment_current" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);
