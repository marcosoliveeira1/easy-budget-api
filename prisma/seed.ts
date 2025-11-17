import { prisma } from '../src/infra/database/prisma';
import { v7 as uuidv7 } from 'uuid';

async function main() {
    const cards = [
        { id: uuidv7(), name: "Bradesco", closingDay: 28, dueDay: 10 },
        { id: uuidv7(), name: "Bradesco/Amazon", closingDay: 28, dueDay: 10 },
        { id: uuidv7(), name: "Bradesco/Darlana", closingDay: 28, dueDay: 10 },
        { id: uuidv7(), name: "BTG", closingDay: 28, dueDay: 10 },
        { id: uuidv7(), name: "Nubank", closingDay: 28, dueDay: 10 },
    ]

    for (const card of cards) {
        console.log(`Upserting card: ${card.name}`)
        await prisma.card.upsert({
            where: { name: card.name },
            update: {},
            create: card,
        })
    }
}
main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })