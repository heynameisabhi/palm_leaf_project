import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions, getAuthSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { writeFile } from "fs/promises";
import { join } from "path";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";

export async function POST(request: NextRequest) {
    try {
        const session = await getAuthSession();

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const formData = await request.formData();
        
        // Get the CSV file and folders base path
        const csvFile = formData.get("csvFile") as File;
        const foldersBasePath = formData.get("foldersBasePath") as string;
        
        if (!csvFile || !foldersBasePath) {
            return NextResponse.json(
                { error: "CSV file and folders base path are required" },
                { status: 400 }
            );
        }

        // Create a temporary directory for the CSV file
        const tempDir = os.tmpdir();
        const csvFilePath = join(tempDir, csvFile.name);
        
        // Write the CSV file to the temp directory
        const csvBuffer = Buffer.from(await csvFile.arrayBuffer());
        await writeFile(csvFilePath, csvBuffer);
        
        try {
            // Process the CSV file using the Python backend
            const pythonResponse = await axios.post("http://localhost:8000/process-csv", {
                csv_file_path: csvFilePath,
                folders_base_path: foldersBasePath
            });
            
            const processedData = pythonResponse.data;
            
            if (!processedData.data || !Array.isArray(processedData.data)) {
                return NextResponse.json(
                    { error: "Invalid data returned from Python backend" },
                    { status: 500 }
                );
            }
            
            // Insert the data into the database using a transaction
            await db.$transaction(async (tx) => {
                for (const item of processedData.data) {
                    // 1. Create GranthaDeck
                    const granthaDeck = await tx.granthaDeck.create({
                        data: {
                            // grantha_deck_id is the same as grantha_deck_name
                            grantha_deck_id: item.deck_name,
                            grantha_deck_name: item.deck_name,
                            grantha_owner_name: item.deck_origin,
                            grantha_source_address: item.deck_owner_name || "",
                            length_in_cms: item.length_in_cms,
                            width_in_cms: item.width_in_cms,
                            total_leaves: Math.ceil(item.total_images / 2),
                            total_images: item.total_images,
                            stitch_or_nonstitch: item.stitch_or_nonstitch,
                            physical_condition: item.physical_condition,
                            user_id: userId,
                        },
                    });

                    // 2. Check/Create Author
                    let author = await tx.author.findFirst({
                        where: {
                            author_name: {
                                equals: item.grantha.author.trim().toLowerCase(),
                                mode: "insensitive",
                            },
                        },
                    });
                    
                    // currently what iam doing is that iam creating a new author if it doesnt exist (it just creates a name and id, but the remmaining fields are still null)

                    // TODO: Search for a different apprach to deal with this

                    if (!author) {
                        author = await tx.author.create({
                            data: { 
                                author_name: item.grantha.author.trim()
                            }
                        });
                    }

                    // 3. Check/Create Language
                    let language = await tx.language.findFirst({
                        where: {
                            language_name: {
                                equals: item.grantha.language.trim().toLowerCase(),
                                mode: "insensitive",
                            },
                        },
                    });

                    if (!language) {
                        language = await tx.language.create({
                            data: { 
                                language_name: item.grantha.language.trim() 
                            }
                        });
                    }

                    // 4. Create main Grantha
                    const grantha = await tx.grantha.create({
                        data: {
                            grantha_id: item.grantha_id,
                            grantha_deck_id: granthaDeck.grantha_deck_id,
                            grantha_name: item.grantha.name,
                            language_id: language.language_id,
                            author_id: author.author_id,
                            remarks: item.remarks || "",
                            description: ""
                        },
                    });

                    // 5. Create ScannedImages for main Grantha
                    for (const image of item.grantha.images) {
                        const scannedImage = await tx.scannedImage.create({
                            data: {
                                image_name: image.name,
                                image_url: image.path,
                                grantha_id: grantha.grantha_id,
                            },
                        });

                        // Create Scanning Properties
                        await tx.scanningProperties.create({
                            data: {
                                image_id: scannedImage.image_id,
                                worked_by: "",
                                file_format: image.extension.replace(".", "").toUpperCase(),
                                scanner_model: "Unknown", // Can be updated from form if available
                                resolution_dpi: Array.isArray(image.dpi) && image.dpi.length > 0 
                                    ? String(image.dpi[0]) 
                                    : "Unknown",
                                lighting_conditions: "",
                                color_depth: "",
                                scanning_start_date: item.scanning_start_date || null,
                                scanning_completed_date: item.scanning_completed_date || null,
                                post_scanning_completed_date: item.post_scanning_completed_date || null,
                                horizontal_or_vertical_scan: item.horizontal_or_vertical_scan || "",
                            },
                        });
                    }

                    // 6. Process Subworks
                    for (const subwork of item.subworks) {
                        // Check/Create Author for subwork
                        let subworkAuthor = await tx.author.findFirst({
                            where: {
                                author_name: {
                                    equals: subwork.author.trim().toLowerCase(),
                                    mode: "insensitive",
                                },
                            },
                        });

                        // same as what i did for the main grantha author

                        // TODO: Search for a different apprach to deal with this

                        if (!subworkAuthor) {
                            subworkAuthor = await tx.author.create({
                                data: { 
                                    author_name: subwork.author.trim() 
                                }
                            });
                        }

                        // Check/Create Language for subwork
                        let subworkLanguage = await tx.language.findFirst({
                            where: {
                                language_name: {
                                    equals: subwork.language.trim().toLowerCase(),
                                    mode: "insensitive",
                                },
                            },
                        });

                        if (!subworkLanguage) {
                            subworkLanguage = await tx.language.create({
                                data: { 
                                    language_name: subwork.language.trim() 
                                }
                            });
                        }

                        // Create Subwork Grantha
                        const subworkGrantha = await tx.grantha.create({
                            data: {
                                grantha_id: subwork.grantha_id,
                                grantha_deck_id: granthaDeck.grantha_deck_id,
                                grantha_name: subwork.name,
                                language_id: subworkLanguage.language_id,
                                author_id: subworkAuthor.author_id,

                                //  subwork remarks is the same as the main grantha remarks (remarks is same for all the granthas in a particular deck)

                                // TODO: description needs to bed filled from the ui
                                remarks: item.remarks || "",
                                description: ""
                            },
                        });

                        // Create Subwork ScannedImages
                        if (subwork.images && Array.isArray(subwork.images)) {
                            for (const image of subwork.images) {
                                const scannedImage = await tx.scannedImage.create({
                                    data: {
                                        image_name: image.name,
                                        image_url: image.path,
                                        grantha_id: subworkGrantha.grantha_id,
                                    },
                                });

                                // Create Scanning Properties
                                await tx.scanningProperties.create({
                                    data: {
                                        image_id: scannedImage.image_id,
                                        worked_by: "",
                                        file_format: image.extension.replace(".", "").toUpperCase(),

                                        // TODO: currently i am keeping it as unknown later i will add a dropdown in the ui to select the scanner model

                                        scanner_model: "Unknown",

                                        // Check this once  (format of resolution_dpi)
                                        resolution_dpi: Array.isArray(image.dpi) && image.dpi.length > 0 
                                            ? String(image.dpi[0]) 
                                            : "Unknown",
                                        lighting_conditions: "",
                                        color_depth: "",
                                        scanning_start_date: item.scanning_start_date || null,
                                        scanning_completed_date: item.scanning_completed_date || null,
                                        post_scanning_completed_date: item.post_scanning_completed_date || null,
                                        horizontal_or_vertical_scan: item.horizontal_or_vertical_scan || "",
                                    },
                                });
                            }
                        }
                    }
                }
            }, {
                // Set a longer timeout for larger datasets
                timeout: 60000,
                // Maximum number of retries for the transaction
                maxWait: 10000,
            });
            
            // Clean up the temporary file
            fs.unlinkSync(csvFilePath);
            
            return NextResponse.json({ 
                message: "Bulk insertion completed successfully.",
                items_processed: processedData.data.length 
            }, { status: 200 });
            
        } catch (error: any) {
            console.error("Error processing data:", error);
            
            // Clean up the temporary file if it exists
            if (fs.existsSync(csvFilePath)) {
                fs.unlinkSync(csvFilePath);
            }
            
            if (error.response) {
                return NextResponse.json({ 
                    error: `Python backend error: ${error.response.data.detail || error.response.statusText}` 
                }, { status: error.response.status });
            }
            
            return NextResponse.json({ 
                error: "Failed to process data" 
            }, { status: 500 });
        }
        
    } catch (error: any) {
        console.error("Error processing request:", error);
        return NextResponse.json({ 
            error: error.message || "Internal server error" 
        }, { status: 500 });
    }
} 