import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import fetch from "node-fetch";

async function loadFontBinString(): Promise<string> {
    const font = await fetch(process.env.NOTO_SANS_FONT_PATH || 'http://localhost:3000/NotoSans.ttf');
    const arrayBuffer = await font.arrayBuffer();
    let binaryString = '';
    const bytes = new Uint8Array(arrayBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binaryString += String.fromCharCode(bytes[i]);
    }
    return binaryString;
}

interface ReportOptions {
    // Deck Information
    deckBasicInfo: boolean;
    deckPhysicalProperties: boolean;
    deckCreationDetails: boolean;
    
    // User Information
    userBasicInfo: boolean;
    userContactInfo: boolean;
    userPermissions: boolean;
    
    // Grantha Content
    granthaBasicInfo: boolean;
    granthaDescriptions: boolean;
    
    // Author & Language
    authorDetails: boolean;
    languageInfo: boolean;
    
    // Image Information
    imageCount: boolean;
    imageDetails: boolean;
    scanningProperties: boolean;
    
    // Additional Options
    statisticalSummary: boolean;
    exportMetadata: boolean;
}

type GranthaDeck = {
    grantha_deck_id: string;
    grantha_deck_name: string | null;
    grantha_owner_name: string | null;
    grantha_source_address: string | null;
    length_in_cms: number | null;
    width_in_cms: number | null;
    total_leaves: number | null;
    total_images: number | null;
    stitch_or_nonstitch: string | null;
    physical_condition: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: {
        user_id: string;
        user_name: string;
        email: string;
        role: string;
        phone_no?: string | null;
        address?: string | null;
        accessControls?: Array<{
            permission_level: string | null;
        }> | false;
    };
    granthas: Array<{
        grantha_id: string;
        grantha_name: string | null;
        description: string | null;
        remarks: string | null;
        author?: {
            author_name: string | null;
            birth_year: string | null;
            death_year: string | null;
            bio: string | null;
            scribe_name: string | null;
        } | false;
        language?: {
            language_name: string | null;
        } | false;
        scannedImages?: Array<{
            image_id: string;
            image_name: string;
            image_url: string;
            scanningProperties?: {
                worked_by: string | null;
                file_format: string;
                scanner_model: string;
                resolution_dpi: string;
                lighting_conditions: string | null;
                color_depth: string | null;
                scanning_start_date: string | null;
                scanning_completed_date: string | null;
                post_scanning_completed_date: string | null;
                horizontal_or_vertical_scan: string | null;
            } | null;
        }> | false;
    }>;
};

export async function POST(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session || session.user.role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { timeRange, reportOptions }: { timeRange: string; reportOptions: ReportOptions } = body;

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

        // Always include basic structure to maintain type safety
        const baseInclude = {
            user: {
                select: {
                    user_id: true,
                    user_name: true,
                    email: true,
                    role: true,
                    phone_no: reportOptions.userContactInfo,
                    address: reportOptions.userContactInfo,
                    accessControls: reportOptions.userPermissions ? {
                        select: {
                            permission_level: true
                        }
                    } : false
                }
            },
            granthas: {
                include: {
                    author: reportOptions.authorDetails,
                    language: reportOptions.languageInfo,
                    scannedImages: (reportOptions.imageCount || reportOptions.imageDetails || reportOptions.scanningProperties) ? {
                        include: {
                            scanningProperties: reportOptions.scanningProperties
                        }
                    } : false
                }
            }
        };

        // Fetch data from database with proper typing
        const rawGranthaDecks = await db.granthaDeck.findMany({
            where: {
                ...(startDate && {
                    createdAt: {
                        gte: startDate
                    }
                })
            },
            include: baseInclude,
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Type assertion with proper handling
        const granthaDecks = rawGranthaDecks as unknown as GranthaDeck[];

        // Create PDF
        const doc = new jsPDF();

        const fontData: string = await loadFontBinString();
        doc.addFileToVFS("NotoSans.ttf", fontData);
        doc.addFont("NotoSans.ttf", "NotoSans", "normal");
        doc.setFont("NotoSans");
        
        // Add title
        doc.setFontSize(20);
        doc.text("Grantha Records Report", 105, 20, { align: "center" });
        
        // Add metadata if requested
        if (reportOptions.exportMetadata) {
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 200, 15, { align: "right" });
            doc.text(`Time Range: ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}`, 200, 20, { align: "right" });
            doc.text(`Generated by: ${session.user.name}`, 200, 25, { align: "right" });
        }

        let yPosition = reportOptions.exportMetadata ? 45 : 35;

        // Add statistical summary if requested
        if (reportOptions.statisticalSummary) {
            doc.setFontSize(14);
            doc.text("Summary Statistics", 14, yPosition);
            yPosition += 10;

            const totalDecks = granthaDecks.length;
            const totalGranthas = granthaDecks.reduce((sum, deck) => sum + (deck.granthas?.length || 0), 0);
            const totalImages = granthaDecks.reduce((sum, deck) => 
                sum + (deck.granthas?.reduce((imgSum, grantha) => 
                    imgSum + (grantha.scannedImages && Array.isArray(grantha.scannedImages) ? grantha.scannedImages.length : 0), 0) || 0), 0);

            doc.setFontSize(10);
            doc.text(`Total Decks: ${totalDecks}`, 14, yPosition);
            yPosition += 5;
            doc.text(`Total Granthas: ${totalGranthas}`, 14, yPosition);
            yPosition += 5;
            doc.text(`Total Images: ${totalImages}`, 14, yPosition);
            yPosition += 15;
        }

        // Process each deck
        granthaDecks.forEach((deck, index) => {
            // Check if we need a new page
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }

            // Deck header
            doc.setFontSize(14);
            doc.text(`Deck ${index + 1}${deck.grantha_deck_name ? `: ${deck.grantha_deck_name}` : ''}`, 14, yPosition);
            yPosition += 10;

            // Deck basic info
            if (reportOptions.deckBasicInfo) {
                doc.setFontSize(10);
                doc.text(`Deck ID: ${deck.grantha_deck_id}`, 14, yPosition);
                yPosition += 5;
                if (deck.grantha_deck_name) {
                    doc.text(`Deck Name: ${deck.grantha_deck_name}`, 14, yPosition);
                    yPosition += 5;
                }
                doc.text(`Created: ${deck.createdAt.toLocaleDateString()}`, 14, yPosition);
                yPosition += 5;
            }

            // Deck creation details
            if (reportOptions.deckCreationDetails) {
                doc.setFontSize(10);
                if (deck.grantha_owner_name) {
                    doc.text(`Owner: ${deck.grantha_owner_name}`, 14, yPosition);
                    yPosition += 5;
                }
                if (deck.grantha_source_address) {
                    doc.text(`Source Address: ${deck.grantha_source_address}`, 14, yPosition);
                    yPosition += 5;
                }
            }

            // Deck physical properties
            if (reportOptions.deckPhysicalProperties) {
                doc.setFontSize(10);
                if (deck.length_in_cms) {
                    doc.text(`Length: ${deck.length_in_cms} cm`, 14, yPosition);
                    yPosition += 5;
                }
                if (deck.width_in_cms) {
                    doc.text(`Width: ${deck.width_in_cms} cm`, 14, yPosition);
                    yPosition += 5;
                }
                if (deck.total_leaves) {
                    doc.text(`Total Leaves: ${deck.total_leaves}`, 14, yPosition);
                    yPosition += 5;
                }
                if (deck.stitch_or_nonstitch) {
                    doc.text(`Stitch Type: ${deck.stitch_or_nonstitch}`, 14, yPosition);
                    yPosition += 5;
                }
                if (deck.physical_condition) {
                    doc.text(`Physical Condition: ${deck.physical_condition}`, 14, yPosition);
                    yPosition += 5;
                }
            }

            // User information
            if (deck.user && (reportOptions.userBasicInfo || reportOptions.userContactInfo || reportOptions.userPermissions)) {
                doc.setFontSize(12);
                doc.text("User Information:", 14, yPosition);
                yPosition += 7;
                
                if (reportOptions.userBasicInfo) {
                    doc.setFontSize(10);
                    doc.text(`User: ${deck.user.user_name} (${deck.user.email})`, 18, yPosition);
                    yPosition += 5;
                }
                
                if (reportOptions.userContactInfo) {
                    if (deck.user.phone_no) {
                        doc.text(`Phone: ${deck.user.phone_no}`, 18, yPosition);
                        yPosition += 5;
                    }
                    if (deck.user.address) {
                        doc.text(`Address: ${deck.user.address}`, 18, yPosition);
                        yPosition += 5;
                    }
                }
                
                if (reportOptions.userPermissions) {
                    doc.text(`Role: ${deck.user.role}`, 18, yPosition);
                    yPosition += 5;
                    if (deck.user.accessControls && deck.user.accessControls.length > 0) {
                        const permissions = deck.user.accessControls.map(ac => ac.permission_level).join(', ');
                        doc.text(`Permissions: ${permissions}`, 18, yPosition);
                        yPosition += 5;
                    }
                }
            }

            // Grantha information
            if (deck.granthas && deck.granthas.length > 0) {
                if (reportOptions.granthaBasicInfo || reportOptions.granthaDescriptions || 
                    reportOptions.authorDetails || reportOptions.languageInfo || 
                    reportOptions.imageCount || reportOptions.imageDetails || reportOptions.scanningProperties) {
                    
                    doc.setFontSize(12);
                    doc.text(`Granthas (${deck.granthas.length}):`, 14, yPosition);
                    yPosition += 10;

                    // Create table data for granthas
                    const tableHeaders: string[] = ['S.No.'];
                    const columnStyles: any = { 0: { cellWidth: 15 } };
                    let colIndex = 1;

                    if (reportOptions.granthaBasicInfo) {
                        tableHeaders.push('Name');
                        columnStyles[colIndex] = { cellWidth: 40 };
                        colIndex++;
                    }

                    if (reportOptions.authorDetails) {
                        tableHeaders.push('Author');
                        columnStyles[colIndex] = { cellWidth: 30 };
                        colIndex++;
                    }

                    if (reportOptions.languageInfo) {
                        tableHeaders.push('Language');
                        columnStyles[colIndex] = { cellWidth: 25 };
                        colIndex++;
                    }

                    if (reportOptions.imageCount) {
                        tableHeaders.push('Images');
                        columnStyles[colIndex] = { cellWidth: 20 };
                        colIndex++;
                    }

                    if (reportOptions.granthaDescriptions) {
                        tableHeaders.push('Description');
                        columnStyles[colIndex] = { cellWidth: 'auto' };
                        colIndex++;
                    }

                    const tableData = deck.granthas.map((grantha, gIndex) => {
                        const row: string[] = [(gIndex + 1).toString()];

                        if (reportOptions.granthaBasicInfo) {
                            row.push(grantha.grantha_name || 'Unnamed Grantha');
                        }

                        if (reportOptions.authorDetails) {
                            row.push(grantha.author && typeof grantha.author === 'object' ? grantha.author.author_name || 'Unknown' : 'Unknown');
                        }

                        if (reportOptions.languageInfo) {
                            row.push(grantha.language && typeof grantha.language === 'object' ? grantha.language.language_name || 'Unknown' : 'Unknown');
                        }

                        if (reportOptions.imageCount) {
                            row.push(grantha.scannedImages && Array.isArray(grantha.scannedImages) ? grantha.scannedImages.length.toString() : '0');
                        }

                        if (reportOptions.granthaDescriptions) {
                            const desc = grantha.description || 'No description';
                            const remarks = grantha.remarks ? ` | Remarks: ${grantha.remarks}` : '';
                            row.push(desc + remarks);
                        }

                        return row;
                    });

                    autoTable(doc, {
                        startY: yPosition,
                        head: [tableHeaders],
                        body: tableData,
                        theme: 'grid',
                        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                        styles: { fontSize: 8, cellPadding: 2 },
                        columnStyles: columnStyles
                    });

                    yPosition = (doc as any).lastAutoTable.finalY + 5;

                    // Detailed author information if requested
                    if (reportOptions.authorDetails) {
                        const uniqueAuthors = deck.granthas
                            .map(g => g.author)
                            .filter((author, index, self) => 
                                author && typeof author === 'object' && 
                                self.findIndex(a => a && typeof a === 'object' && a.author_name === author.author_name) === index
                            ) as Array<{
                                author_name: string | null;
                                birth_year: string | null;
                                death_year: string | null;
                                bio: string | null;
                                scribe_name: string | null;
                            }>;

                        if (uniqueAuthors.length > 0) {
                            doc.setFontSize(11);
                            doc.text("Author Details:", 14, yPosition);
                            yPosition += 7;

                            uniqueAuthors.forEach(author => {
                                doc.setFontSize(9);
                                doc.text(`• ${author.author_name || 'Unknown'}`, 18, yPosition);
                                yPosition += 4;
                                
                                if (author.birth_year || author.death_year) {
                                    const years = `${author.birth_year || '?'} - ${author.death_year || '?'}`;
                                    doc.text(`  Years: ${years}`, 22, yPosition);
                                    yPosition += 4;
                                }
                                
                                if (author.scribe_name) {
                                    doc.text(`  Scribe: ${author.scribe_name}`, 22, yPosition);
                                    yPosition += 4;
                                }
                                
                                if (author.bio) {
                                    const bioLines = doc.splitTextToSize(`  Bio: ${author.bio}`, 170);
                                    doc.text(bioLines, 22, yPosition);
                                    yPosition += bioLines.length * 4;
                                }
                                yPosition += 2;
                            });
                        }
                    }

                    // Detailed image information if requested
                    if (reportOptions.imageDetails || reportOptions.scanningProperties) {
                        const allImages = deck.granthas.flatMap(g => 
                            g.scannedImages && Array.isArray(g.scannedImages) ? g.scannedImages : []
                        );
                        
                        if (allImages.length > 0) {
                            doc.setFontSize(11);
                            doc.text("Image Details:", 14, yPosition);
                            yPosition += 7;

                            const imageHeaders: string[] = ['Image Name'];
                            const imageColumnStyles: any = { 0: { cellWidth: 50 } };
                            let imageColIndex = 1;

                            if (reportOptions.imageDetails) {
                                imageHeaders.push('URL');
                                imageColumnStyles[imageColIndex] = { cellWidth: 60 };
                                imageColIndex++;
                            }

                            if (reportOptions.scanningProperties) {
                                imageHeaders.push('Format', 'Scanner', 'Resolution');
                                imageColumnStyles[imageColIndex] = { cellWidth: 25 };
                                imageColumnStyles[imageColIndex + 1] = { cellWidth: 30 };
                                imageColumnStyles[imageColIndex + 2] = { cellWidth: 25 };
                            }

                            const imageTableData = allImages.slice(0, 20).map(image => { // Limit to 20 images for space
                                const row: string[] = [image.image_name];

                                if (reportOptions.imageDetails) {
                                    row.push(image.image_url);
                                }

                                if (reportOptions.scanningProperties && image.scanningProperties) {
                                    row.push(
                                        image.scanningProperties.file_format,
                                        image.scanningProperties.scanner_model,
                                        image.scanningProperties.resolution_dpi
                                    );
                                } else if (reportOptions.scanningProperties) {
                                    row.push('N/A', 'N/A', 'N/A');
                                }

                                return row;
                            });

                            autoTable(doc, {
                                startY: yPosition,
                                head: [imageHeaders],
                                body: imageTableData,
                                theme: 'grid',
                                headStyles: { fillColor: [52, 152, 219], textColor: 255 },
                                styles: { fontSize: 7, cellPadding: 1 },
                                columnStyles: imageColumnStyles
                            });

                            yPosition = (doc as any).lastAutoTable.finalY + 5;

                            if (allImages.length > 20) {
                                doc.setFontSize(8);
                                doc.text(`... and ${allImages.length - 20} more images`, 14, yPosition);
                                yPosition += 5;
                            }
                        }
                    }
                }
            }

            yPosition += 10; // Space between decks

            // Add new page if needed
            if (yPosition > 250 && index < granthaDecks.length - 1) {
                doc.addPage();
                yPosition = 20;
            }
        });

        // Add footer with generation info if metadata is enabled
        if (reportOptions.exportMetadata) {
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(`Page ${i} of ${pageCount}`, 200, 290, { align: "right" });
                doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 290);
            }
        }

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