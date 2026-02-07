import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStitchTypes() {
    try {
        console.log('Checking all stitch_or_nonstitch values in the database...\n');

        // Get all unique stitch types
        const allDecks = await prisma.granthaDeck.findMany({
            select: {
                grantha_deck_id: true,
                grantha_deck_name: true,
                stitch_or_nonstitch: true
            },
            orderBy: {
                grantha_deck_id: 'asc'
            }
        });

        console.log(`Total decks: ${allDecks.length}\n`);

        // Group by stitch type
        const stitchTypes = new Map<string, number>();
        allDecks.forEach(deck => {
            const type = deck.stitch_or_nonstitch || 'null';
            stitchTypes.set(type, (stitchTypes.get(type) || 0) + 1);
        });

        console.log('📊 Stitch type distribution:');
        stitchTypes.forEach((count, type) => {
            console.log(`  ${type}: ${count} record(s)`);
        });

        console.log('\n📋 All records:');
        allDecks.forEach(deck => {
            console.log(`  ${deck.grantha_deck_id}: ${deck.grantha_deck_name} -> "${deck.stitch_or_nonstitch}"`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkStitchTypes();
