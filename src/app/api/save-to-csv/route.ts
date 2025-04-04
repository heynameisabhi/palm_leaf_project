import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parse } from "json2csv";

const outputDir = path.join(process.cwd(), "public", "csv");
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

export async function POST(request: NextRequest) {
    try {
        const reqBody = await request.json();
        const { granthaDeckId, totalImages, totalLeaves, mainGranthaImagesAndDetails, subGranthas } = reqBody;
        
        // 1. GranthaDeck.csv
        const granthaDeckData = [{
            grantha_deck_id: granthaDeckId,
            grantha_deck_name: "", 
            grantha_owner_name: "", 
            grantha_source_address: "", 
            length_in_cms: "", 
            width_in_cms: "", 
            total_leaves: totalLeaves,
            total_images: totalImages,
            stitch_or_nonstitch: "", 
        }];
        fs.writeFileSync(path.join(outputDir, "GranthaDeck.csv"), parse(granthaDeckData));
        
        console.log("GranthaDeck.csv created successfully!")

        // 2. Grantha.csv
        const granthaData = [
            {
                grantha_id: `${granthaDeckId}_main_grantha`,
                grantha_name: "", 
                language: "", 
                author: "", 
                remarks: "", 
                description: "", 
            },
            ...subGranthas.map((sub: any) => ({
                grantha_id: sub.subgrantha_name,
                grantha_name: "", 
                language: "", 
                author: "", 
                remarks: "", 
                description: "", 
            }))
        ];
        fs.writeFileSync(path.join(outputDir, "Grantha.csv"), parse(granthaData));

        console.log("Grantha.csv created successfully!")


        // 3. ScannedImageAndProperties.csv
        const imageData = [
            ...mainGranthaImagesAndDetails.map((img: any) => ({
                image_id: img.name.replace(/\.[^/.]+$/, ""),
                image_name: img.name.replace(/\.[^/.]+$/, ""),
                image_url: img.path,
                grantha_id: `${granthaDeckId}_main_grantha`,
                worked_by: "", 
                file_format: img.extension.replace(".", "").toUpperCase(),
                scanner_model: "", 
                resolution_dpi: img.dpi.map(Math.round).join("x"),
                lighting_conditions: "", 
                color_depth: "", 
                scanning_start_date: "", 
                scanning_completed_date: "", 
                post_scanning_completed_date: "", 
                horizontal_or_vertical_scan: "", 
            })),
            ...subGranthas.flatMap((sub: any) =>
                sub.images.map((img: any) => ({
                    image_id: img.name.replace(/\.[^/.]+$/, ""),
                    image_name: img.name.replace(/\.[^/.]+$/, ""),
                    image_url: img.path,
                    grantha_id: sub.subgrantha_name,
                    worked_by: "", 
                    file_format: img.extension.replace(".", "").toUpperCase(),
                    scanner_model: "", 
                    resolution_dpi: img.dpi.map(Math.round).join("x"),
                    lighting_conditions: "", 
                    color_depth: "", 
                    scanning_start_date: "", 
                    scanning_completed_date: "", 
                    post_scanning_completed_date: "", 
                    horizontal_or_vertical_scan: "", 
                }))
            )
        ];
        fs.writeFileSync(path.join(outputDir, "ScannedImageAndProperties.csv"), parse(imageData));

        console.log("ScannedImageAndProperties.csv created successfully!")

        return NextResponse.json({ message: "CSV files created successfully" }, { status: 200 });
    } catch (error: any) {
        console.log(error.message)
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
