import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parse } from "json2csv";
import { getAuthSession } from "@/lib/auth";

const outputDir = path.join(process.cwd(), "public", "csv");
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

export async function POST(request: NextRequest) {
    try {
        // Get the authenticated user's ID
        const session = await getAuthSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const userId = session.user.id;
        
        const reqBody = await request.json();
        const { 
            granthaDeckId, 
            totalImages, 
            totalLeaves, 
            mainGranthaImagesAndDetails, 
            subGranthas,
            scanType,
            stitchType,
            physicalCondition
        } = reqBody;
        
        // Create user-specific filenames
        const userGranthaDeckFile = `GranthaDeck_${userId}.csv`;
        const userGranthaFile = `Grantha_${userId}.csv`;
        const userScannedImageFile = `ScannedImageAndProperties_${userId}.csv`;
        
        // 1. GranthaDeck.csv
        const granthaDeckData = [{
            grantha_deck_id: granthaDeckId,
            total_leaves: totalLeaves,
            total_images: totalImages,

            // this field need not be filled here
            // created_by: userId,
            stitch_or_nonstitch: stitchType,
            physical_condition: physicalCondition,
            grantha_deck_name: "", 
            grantha_owner_name: "", 
            grantha_source_address: "", 
            length_in_cms: "", 
            width_in_cms: "", 
        }];
        fs.writeFileSync(path.join(outputDir, userGranthaDeckFile), parse(granthaDeckData));
        
        console.log(`${userGranthaDeckFile} created successfully!`);

        // 2. Grantha.csv
        const granthaData = [
            {
                grantha_id: `${granthaDeckId}_main_grantha`,

                // this is not required to be filled
                // created_by: userId,
                grantha_name: "", 
                language: "", 
                author: "", 
                remarks: "", 
                description: "", 
            },
            ...subGranthas.map((sub: any) => ({
                grantha_id: sub.subgrantha_name,
                // created_by: userId,
                grantha_name: "", 
                language: "", 
                author: "", 
                remarks: "", 
                description: "", 
            }))
        ];
        fs.writeFileSync(path.join(outputDir, userGranthaFile), parse(granthaData));

        console.log(`${userGranthaFile} created successfully!`);

        console.log("mainGranthaImagesAndDetails", mainGranthaImagesAndDetails);

        // 3. ScannedImageAndProperties.csv
        const imageData = [
            ...mainGranthaImagesAndDetails.map((img: any) => ({
                image_name: img.name.replace(/\.[^/.]+$/, ""),
                image_url: img.path,
                grantha_id: `${granthaDeckId}_main_grantha`,
                file_format: img.extension.replace(".", "").toUpperCase(),
                resolution_dpi: Array.isArray(img.dpi) ? img.dpi.map(Math.round).join("x") : "Unknown",
                horizontal_or_vertical_scan: scanType,
                // created_by: userId,
                worked_by: "", 
                scanner_model: "", 
                lighting_conditions: "", 
                color_depth: "", 
                scanning_start_date: "", 
                scanning_completed_date: "", 
                post_scanning_completed_date: "", 
            })),
            ...subGranthas.flatMap((sub: any) =>
                sub.images.map((img: any) => ({
                    image_name: img.name.replace(/\.[^/.]+$/, ""),
                    image_url: img.path,
                    grantha_id: sub.subgrantha_name,
                    file_format: img.extension.replace(".", "").toUpperCase(),
                    resolution_dpi: Array.isArray(img.dpi) ? img.dpi.map(Math.round).join("x") : "Unknown",
                    horizontal_or_vertical_scan: scanType,
                    // created_by: userId,
                    worked_by: "", 
                    scanner_model: "", 
                    lighting_conditions: "", 
                    color_depth: "", 
                    scanning_start_date: "", 
                    scanning_completed_date: "", 
                    post_scanning_completed_date: "", 
                }))
            )
        ];
        fs.writeFileSync(path.join(outputDir, userScannedImageFile), parse(imageData));

        console.log(`${userScannedImageFile} created successfully!`);

        // Return filenames with user ID for the frontend to use
        return NextResponse.json({ 
            message: "CSV files created successfully",
            files: {
                granthaDeck: userGranthaDeckFile,
                grantha: userGranthaFile,
                scannedImage: userScannedImageFile
            }
        }, { status: 200 });
    } catch (error: any) {
        console.log(error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
