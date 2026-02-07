import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateStitchType() {
    try {
        console.log('Starting to update stitch_or_nonstitch values...');

        // Update all records that have "non-stitch" to "non stitch"
        const result = await prisma.granthaDeck.updateMany({
            where: {
                stitch_or_nonstitch: 'non-stitch'
            },
            data: {
                stitch_or_nonstitch: 'non stitch'
            }
        });

        console.log(`✅ Successfully updated ${result.count} records from "non-stitch" to "non stitch"`);

        // Verify the update
        const updatedRecords = await prisma.granthaDeck.findMany({
            where: {
                stitch_or_nonstitch: 'non stitch'
            },
            select: {
                grantha_deck_id: true,
                grantha_deck_name: true,
                stitch_or_nonstitch: true
            }
        });

        console.log('\n📋 Updated records:');
        updatedRecords.forEach(record => {
            console.log(`  - ${record.grantha_deck_id}: ${record.grantha_deck_name} -> ${record.stitch_or_nonstitch}`);
        });

        // Check if any old values remain
        const remainingOldRecords = await prisma.granthaDeck.findMany({
            where: {
                stitch_or_nonstitch: 'non-stitch'
            }
        });

        if (remainingOldRecords.length > 0) {
            console.log(`\n⚠️  Warning: ${remainingOldRecords.length} records still have "non-stitch"`);
        } else {
            console.log('\n✅ All records have been updated successfully!');
        }

    } catch (error) {
        console.error('❌ Error updating records:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateStitchType();
