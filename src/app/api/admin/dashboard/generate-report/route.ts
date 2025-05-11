import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type GranthaDeck = {
    grantha_deck_id: string;
    grantha_deck_name: string | null;
    createdAt: Date;
    user: {
        user_name: string;
        email: string;
    };
    granthas: Array<{
        grantha_name: string | null;
        description: string | null;
        author: {
            author_name: string | null;
        };
        language: {
            language_name: string | null;
        };
        scannedImages: Array<{
            image_id: string;
        }>;
    }>;
};

export async function GET(request: Request) {
    try {

        
        const session = await getAuthSession();
        if (!session || session.user.role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const timeRange = searchParams.get("timeRange") || "all";

        // Calculate date range based on timeRange
        const now = new Date();
        let startDate: Date | undefined;
        
        switch (timeRange) {
            case "week":
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case "month":
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case "year":
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                startDate = undefined;
        }

        // Fetch data from database
        const granthaDecks = await db.granthaDeck.findMany({
            where: {
                ...(startDate && {
                    createdAt: {
                        gte: startDate
                    }
                })
            },
            include: {
                user: {
                    select: {
                        user_name: true,
                        email: true
                    }
                },
                granthas: {
                    include: {
                        author: true,
                        language: true,
                        scannedImages: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        }) as GranthaDeck[];

        // Create PDF
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.text("Grantha Records Report", 105, 20, { align: "center" });
        
        // Add metadata
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 200, 15, { align: "right" });
        doc.text(`Time Range: ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}`, 200, 20, { align: "right" });
        
        let yPosition = 40;

        // Add data for each deck
        granthaDecks.forEach((deck, index) => {
            // Add deck header
            doc.setFontSize(14);
            doc.text(`Deck ${index + 1}: ${deck.grantha_deck_name || 'Unnamed Deck'}`, 14, yPosition);
            yPosition += 10;

            // Add deck details
            doc.setFontSize(10);
            doc.text(`Created by: ${deck.user.user_name} (${deck.user.email})`, 14, yPosition);
            yPosition += 7;
            doc.text(`Created on: ${deck.createdAt.toLocaleDateString()}`, 14, yPosition);
            yPosition += 7;
            doc.text(`Total Granthas: ${deck.granthas.length}`, 14, yPosition);
            yPosition += 10;

            // Add granthas table
            const tableData = deck.granthas.map((grantha, gIndex) => [
                gIndex + 1,
                grantha.grantha_name || 'Unnamed Grantha',
                grantha.author.author_name || 'Unknown',
                grantha.language.language_name || 'Unknown',
                grantha.scannedImages.length.toString(),
                grantha.description || 'No description'
            ]);

            autoTable(doc, {
                startY: yPosition,
                head: [['S.No.', 'Name', 'Author', 'Language', 'Images', 'Description']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: {
                    0: { cellWidth: 11 },
                    1: { cellWidth: 40 },
                    2: { cellWidth: 30 },
                    3: { cellWidth: 30 },
                    4: { cellWidth: 20 },
                    5: { cellWidth: 'auto' }
                }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 10;

            // Add new page if needed
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
        });

        // Convert to buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        // Set up response headers
        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', `attachment; filename=grantha-report-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`);

        return new NextResponse(pdfBuffer, { headers });

    } catch (error) {
        console.error('🔴 Error generating report:', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
} 