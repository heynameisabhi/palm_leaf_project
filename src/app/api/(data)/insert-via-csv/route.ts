import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// Helper function to clean language text by removing quotes and standardizing format
const cleanLanguageText = (text: string): string => {
  if (!text) {
    return text;
  }

  // Remove all types of quotes: single, double, curly quotes, etc.
  let cleaned = text.trim();

  // Remove various quote characters
  const quoteChars = ['"', "'", '"', '"', "`", "´"];
  quoteChars.forEach((quote) => {
    cleaned = cleaned.replace(new RegExp(quote, "g"), "");
  });

  // Clean up extra whitespace
  cleaned = cleaned.trim();

  // Capitalize first letter for consistency
  if (cleaned) {
    cleaned = cleaned[0].toUpperCase() + cleaned.slice(1).toLowerCase();
  }

  return cleaned;
};

// Helper function to delete user CSV files
const deleteUserCsvFiles = (userId: string) => {
  try {
    const outputDir = path.join(process.cwd(), "public", "csv");

    // Files to delete
    const filesToDelete = [
      `GranthaDeck_${userId}.csv`,
      `Grantha_${userId}.csv`,
      `ScannedImageAndProperties_${userId}.csv`,
    ];

    // Delete each file if it exists
    filesToDelete.forEach((file) => {
      const filePath = path.join(outputDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${file}`);
      } else {
        console.log(`File not found: ${file}`);
      }
    });
    return true;
  } catch (error) {
    console.error("Error deleting CSV files:", error);
    return false;
  }
};

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    console.log("Session Data:", session);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Retrieve files from the form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    // Validate the number of files
    if (files.length !== 3) {
      return NextResponse.json(
        { error: "Exactly 3 CSV files are required." },
        { status: 400 }
      );
    }

    // Sort the files by their filenames (this is done to maintain proper order of the csv files so that they can be properly extracted)
    files.sort((a, b) => a.name.localeCompare(b.name));

    // Read and parse each CSV file
    const csvContents = await Promise.all(files.map((file) => file.text()));

    // Parse all files with columns=true
    let parsedFiles: Array<any[]> = [];
    try {
      parsedFiles = csvContents.map((content) =>
        parse(content, { columns: true, skip_empty_lines: true })
      );
    } catch (error) {
      console.error("Error parsing CSV files:", error);
      return NextResponse.json(
        { error: "Invalid CSV format. Please check your files." },
        { status: 400 }
      );
    }

    // Helper to check presence of required columns in a parsed row (case-insensitive)
    const hasColumns = (row: Record<string, any>, required: string[]) => {
      const keys = Object.keys(row).map((k) => k.trim().toLowerCase());
      return required.every((col) => keys.includes(col.toLowerCase()));
    };

    // Required columns for each CSV type
    const GRANHTA_REQUIRED = ["grantha_id", "author", "language"];
    const DECK_REQUIRED = ["grantha_deck_id", "grantha_deck_name"];
    const SCANNED_REQUIRED = ["image_name", "image_url", "grantha_id"];

    // Identify the files by their headers since relying on filenames/order is fragile
    let granthaData: any[] | undefined;
    let granthaDeckData: any[] | undefined;
    let scannedImagesData: any[] | undefined;

    for (const rows of parsedFiles) {
      if (!rows || rows.length === 0) continue;
      const firstRow = rows[0];

      if (!granthaData && hasColumns(firstRow, GRANHTA_REQUIRED)) {
        granthaData = rows;
        continue;
      }

      if (!granthaDeckData && hasColumns(firstRow, DECK_REQUIRED)) {
        granthaDeckData = rows;
        continue;
      }

      if (!scannedImagesData && hasColumns(firstRow, SCANNED_REQUIRED)) {
        scannedImagesData = rows;
        continue;
      }
    }

    // If any file could not be identified, return a helpful error
    if (!granthaData || !granthaDeckData || !scannedImagesData) {
      const headersList = parsedFiles.map((rows) =>
        rows && rows.length > 0 ? Object.keys(rows[0]).join(", ") : "(empty)"
      );

      return NextResponse.json(
        {
          error:
            "Could not identify uploaded CSV files. Ensure you uploaded three CSVs with headers: \n" +
            `Grantha required headers: ${GRANHTA_REQUIRED.join(", ")}\n` +
            `GranthaDeck required headers: ${DECK_REQUIRED.join(", ")}\n` +
            `ScannedImage required headers: ${SCANNED_REQUIRED.join(", ")}\n` +
            `Detected headers per file: ${headersList.join(" | ")}`,
        },
        { status: 400 }
      );
    }

    // Validate non-empty rows in each parsed file
    if (!granthaDeckData.length || !granthaData.length || !scannedImagesData.length) {
      return NextResponse.json(
        { error: "One or more CSV files are empty" },
        { status: 400 }
      );
    }

    // Validate each grantha row has required fields (allow missing author/language by defaulting)
    for (const grantha of granthaData) {
      if (!String(grantha.grantha_id || "").trim()) {
        return NextResponse.json(
          {
            error:
              "Missing required field 'grantha_id' in Grantha CSV. Each row must include: grantha_id. Please check your Grantha CSV.",
            row: grantha,
          },
          { status: 400 }
        );
      }

      // Default missing author/language to 'Unknown' and continue
      if (!String(grantha.author || "").trim()) {
        console.warn(`Grantha ${grantha.grantha_id} missing author. Defaulting to 'Unknown'.`);
        grantha.author = "Unknown";
      }

      if (!String(grantha.language || "").trim()) {
        console.warn(`Grantha ${grantha.grantha_id} missing language. Defaulting to 'Unknown'.`);
        grantha.language = "Unknown";
      }
    }

    // Validate each scanned image row has required fields
    for (const image of scannedImagesData) {
      if (
        !String(image.image_name || "").trim() ||
        !String(image.image_url || "").trim() ||
        !String(image.grantha_id || "").trim()
      ) {
        return NextResponse.json(
          {
            error:
              "Missing required fields in ScannedImage CSV. Each row must include: image_name, image_url, grantha_id. Please check your ScannedImage CSV.",
            row: image,
          },
          { status: 400 }
        );
      }
    }

    // Validate deck row has required fields
    if (
      !String(granthaDeckData[0].grantha_deck_id || "").trim() ||
      !String(granthaDeckData[0].grantha_deck_name || "").trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields in GranthaDeck CSV. The first row must include: grantha_deck_id, grantha_deck_name. Please check your GranthaDeck CSV.",
          row: granthaDeckData[0],
        },
        { status: 400 }
      );
    }

    try {
      // Use a transaction to ensure atomicity - all operations succeed or all fail
      await db.$transaction(
        async (tx) => {
          // 1. fill Grantha deck data
          const granthaDeck = await tx.granthaDeck.create({
            data: {
              grantha_deck_id: granthaDeckData[0].grantha_deck_id,
              grantha_deck_name: granthaDeckData[0].grantha_deck_name,
              grantha_owner_name: granthaDeckData[0].grantha_owner_name,
              grantha_source_address: granthaDeckData[0].grantha_source_address,
              length_in_cms: parseFloat(granthaDeckData[0].length_in_cms) || 0,
              width_in_cms: parseFloat(granthaDeckData[0].width_in_cms) || 0,
              total_leaves: parseInt(granthaDeckData[0].total_leaves) || 0,
              total_images: parseInt(granthaDeckData[0].total_images) || 0,
              stitch_or_nonstitch: granthaDeckData[0].stitch_or_nonstitch,
              physical_condition: granthaDeckData[0].physical_condition || "",
              user_id: userId,
            },
          });

          // 2. fill Grantha data
          console.log("Starting to fill grantha data");

          for (const grantha of granthaData) {
            // Validate required fields
            if (!grantha.grantha_id || !grantha.author || !grantha.language) {
              throw new Error(
                `Missing required fields in Grantha data: ${JSON.stringify(
                  grantha
                )}`
              );
            }

            // Clean the language text to remove quotes and standardize format
            const cleanedLanguage = cleanLanguageText(grantha.language);

            // check if author is present
            let author = await tx.author.findFirst({
              where: {
                author_name: {
                  equals: grantha.author.trim().toLowerCase(),
                  mode: "insensitive",
                },
              },
            });

            if (!author) {
              // If the author doesn't exist, create a placeholder author automatically
              author = await tx.author.create({
                data: { author_name: grantha.author },
              });
              console.log(`Created new author: ${grantha.author}`);
            }

            // Check if the language is already present using cleaned language
            let language = await tx.language.findFirst({
              where: {
                language_name: {
                  equals: cleanedLanguage.toLowerCase(),
                  mode: "insensitive",
                },
              },
            });

            if (!language) {
              // Store the cleaned language name
              language = await tx.language.create({
                data: { language_name: cleanedLanguage },
              });
              console.log(
                `Created new language: ${cleanedLanguage} (original: ${grantha.language})`
              );
            } else {
              console.log(
                `Found existing language: ${language.language_name} (matched with cleaned: ${cleanedLanguage})`
              );
            }

            await tx.grantha.create({
              data: {
                grantha_id: grantha.grantha_id,
                grantha_deck_id: granthaDeck.grantha_deck_id,
                grantha_name: grantha.grantha_name || "",
                language_id: language.language_id,
                author_id: author.author_id,
                remarks: grantha.remarks || "",
                description: grantha.description || "",
              },
            });
          }

          console.log("Starting to fill image data");
          for (const image of scannedImagesData) {
            // Validate required fields
            if (!image.image_name || !image.image_url || !image.grantha_id) {
              throw new Error(
                `Missing required fields in ScannedImage data: ${JSON.stringify(
                  image
                )}`
              );
            }

            // 3. Fill Scanned Image Data
            const scannedImage = await tx.scannedImage.create({
              data: {
                image_name: image.image_name,
                image_url: image.image_url,
                grantha_id: image.grantha_id,
              },
            });

            // 4. Fill Scanning Properties Data
            await tx.scanningProperties.create({
              data: {
                image_id: scannedImage.image_id,
                worked_by: image.worked_by || "",
                file_format: image.file_format || "UNKNOWN",
                scanner_model: image.scanner_model || "UNKNOWN",
                resolution_dpi: image.resolution_dpi || "UNKNOWN",
                lighting_conditions: image.lighting_conditions || "",
                color_depth: image.color_depth || "",
                scanning_start_date: image.scanning_start_date || null,
                scanning_completed_date: image.scanning_completed_date || null,
                post_scanning_completed_date:
                  image.post_scanning_completed_date || null,
                horizontal_or_vertical_scan:
                  image.horizontal_or_vertical_scan || "",
              },
            });
          }

          console.log("Completed database transaction successfully!");
        },
        {
          // Set a longer timeout for larger datasets
          timeout: 30000,
          // Maximum number of retries for the transaction
          maxWait: 5000,
        }
      );

      // After successful transaction, delete the user's CSV files
      const filesDeleted = deleteUserCsvFiles(userId);

      return NextResponse.json(
        {
          message: "Data inserted successfully.",
          filesDeleted: filesDeleted,
        },
        { status: 200 }
      );
    } catch (error) {
      // roll back on transaction failure
      console.error("Transaction failed:", error);

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return NextResponse.json(
            {
              error:
                "A record with this ID already exists. Please use unique identifiers.",
            },
            { status: 409 }
          );
        }

        if (error.code === "P2003") {
          return NextResponse.json(
            {
              error:
                "Foreign key constraint failed. Please check that all referenced IDs exist.",
            },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred during data insertion",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}