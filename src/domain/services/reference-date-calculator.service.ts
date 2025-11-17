import { Card } from '@/domain/entities/card.entity';

export class ReferenceDateCalculator {
  /**
   * Calculates the reference date (first day of the statement month) for a transaction.
   * @param transactionDate The date the transaction occurred.
   * @param card The card used for the transaction.
   * @returns The reference date.
   */
  public calculate(transactionDate: Date, card: Card): Date {
    const transactionDay = transactionDate.getUTCDate();
    let referenceMonth = transactionDate.getUTCMonth();
    let referenceYear = transactionDate.getUTCFullYear();

    // If the transaction occurred on or after the closing day,
    // it belongs to the next month's statement.
    if (transactionDay >= card.closingDay) {
      referenceMonth += 1;
      // getUTCMonth is 0-11, so 12 means next year's January
      if (referenceMonth > 11) {
        referenceMonth = 0; // January
        referenceYear += 1;
      }
    }

    // Return the first day of the reference month in UTC.
    return new Date(Date.UTC(referenceYear, referenceMonth, 1));
  }
}