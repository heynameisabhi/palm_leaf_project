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

// Custom error class for better error handling
class DataInsertionError extends Error {
  constructor(message: string, public context?: any) {
    super(message);
    this.name = "DataInsertionError";
  }
}

export async function POST(request: NextRequest) {
  let csvFilePath: string | null = null;

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
    csvFilePath = join(tempDir, csvFile.name);

    // Write the CSV file to the temp directory
    const csvBuffer = Buffer.from(await csvFile.arrayBuffer());
    await writeFile(csvFilePath, csvBuffer);

    try {
      // Process the CSV file using the Python backend
      const pythonResponse = await axios.post(
        "http://localhost:8000/process-csv",
        {
          csv_file_path: csvFilePath,
          folders_base_path: foldersBasePath,
        }
      );

      const processedData = pythonResponse.data;

      console.log("🟠Processed Data:", processedData);

      if (!processedData.data || !Array.isArray(processedData.data)) {
        throw new DataInsertionError(
          "Invalid data returned from Python backend"
        );
      }

      // Enhanced transaction with better error handling
      const result = await db.$transaction(
        async (tx) => {
          const processedItems = [];

          for (
            let itemIndex = 0;
            itemIndex < processedData.data.length;
            itemIndex++
          ) {
            const item = processedData.data[itemIndex];

            try {
              // Validate required fields before processing
              if (!item.deck_name || !item.deck_id) {
                throw new DataInsertionError(
                  `Missing required fields in item ${itemIndex + 1}`,
                  {
                    itemIndex,
                    item: { deck_name: item.deck_name, deck_id: item.deck_id },
                  }
                );
              }

              // 1. Create GranthaDeck with error handling
              const granthaDeck = await tx.granthaDeck
                .create({
                  data: {
                    grantha_deck_id: item.deck_id,
                    grantha_deck_name: item.deck_name,
                    grantha_owner_name: item.deck_origin || "",
                    grantha_source_address: item.deck_owner_name || "",
                    length_in_cms: item.length_in_cms || 0,
                    width_in_cms: item.width_in_cms || 0,
                    total_leaves: Math.ceil((item.total_images || 0) / 2),
                    total_images: item.total_images || 0,
                    stitch_or_nonstitch: item.stitch_or_nonstitch || "",
                    physical_condition: item.physical_condition || "",
                    user_id: userId,
                  },
                })
                .catch((error) => {
                  if (error.code === "P2002") {
                    // Unique constraint violation
                    throw new DataInsertionError(
                      `Duplicate grantha deck ID: ${item.deck_name}`,
                      {
                        itemIndex,
                        field: "grantha_deck_id",
                        value: item.deck_name,
                      }
                    );
                  }
                  throw new DataInsertionError(
                    `Failed to create grantha deck for item ${itemIndex + 1}: ${
                      error.message
                    }`,
                    { itemIndex, originalError: error }
                  );
                });

              // 2. Handle Author with validation
              if (!item.grantha?.author || item.grantha.author.trim() === "") {
                throw new DataInsertionError(
                  `Missing author for grantha in item ${itemIndex + 1}`,
                  { itemIndex, grantha_id: item.grantha_id }
                );
              }

              let author = await tx.author
                .findFirst({
                  where: {
                    author_name: {
                      equals: item.grantha.author.trim().toLowerCase(),
                      mode: "insensitive",
                    },
                  },
                })
                .catch((error) => {
                  throw new DataInsertionError(
                    `Failed to find author for item ${itemIndex + 1}: ${
                      error.message
                    }`,
                    { itemIndex, author: item.grantha.author }
                  );
                });

              if (!author) {
                author = await tx.author
                  .create({
                    data: {
                      author_name: item.grantha.author.trim(),
                    },
                  })
                  .catch((error) => {
                    throw new DataInsertionError(
                      `Failed to create author for item ${itemIndex + 1}: ${
                        error.message
                      }`,
                      { itemIndex, author: item.grantha.author }
                    );
                  });
              }

              // 3. Handle Language with validation
              if (
                !item.grantha?.language ||
                item.grantha.language.trim() === ""
              ) {
                throw new DataInsertionError(
                  `Missing language for grantha in item ${itemIndex + 1}`,
                  { itemIndex, grantha_id: item.grantha_id }
                );
              }

              let language = await tx.language
                .findFirst({
                  where: {
                    language_name: {
                      equals: item.grantha.language.trim().toLowerCase(),
                      mode: "insensitive",
                    },
                  },
                })
                .catch((error) => {
                  throw new DataInsertionError(
                    `Failed to find language for item ${itemIndex + 1}: ${
                      error.message
                    }`,
                    { itemIndex, language: item.grantha.language }
                  );
                });

              if (!language) {
                language = await tx.language
                  .create({
                    data: {
                      language_name: item.grantha.language.trim(),
                    },
                  })
                  .catch((error) => {
                    throw new DataInsertionError(
                      `Failed to create language for item ${itemIndex + 1}: ${
                        error.message
                      }`,
                      { itemIndex, language: item.grantha.language }
                    );
                  });
              }

              // 4. Create main Grantha
              const grantha = await tx.grantha
                .create({
                  data: {
                    grantha_id: item.grantha_id,
                    grantha_deck_id: granthaDeck.grantha_deck_id,
                    grantha_name: item.grantha.name || "",
                    language_id: language.language_id,
                    author_id: author.author_id,
                    remarks: item.remarks || "",
                    description: "",
                  },
                })
                .catch((error) => {
                  if (error.code === "P2002") {
                    // Unique constraint violation
                    throw new DataInsertionError(
                      `Duplicate grantha ID: ${item.grantha_id}`,
                      { itemIndex, field: "grantha_id", value: item.grantha_id }
                    );
                  }
                  throw new DataInsertionError(
                    `Failed to create grantha for item ${itemIndex + 1}: ${
                      error.message
                    }`,
                    { itemIndex, grantha_id: item.grantha_id }
                  );
                });

              // 5. Create ScannedImages for main Grantha
              if (item.grantha.images && Array.isArray(item.grantha.images)) {
                for (
                  let imgIndex = 0;
                  imgIndex < item.grantha.images.length;
                  imgIndex++
                ) {
                  const image = item.grantha.images[imgIndex];

                  if (!image.name || !image.path) {
                    throw new DataInsertionError(
                      `Missing image name or path for main grantha image ${
                        imgIndex + 1
                      } in item ${itemIndex + 1}`,
                      { itemIndex, imageIndex: imgIndex, image }
                    );
                  }

                  const scannedImage = await tx.scannedImage
                    .create({
                      data: {
                        image_name: image.name.split(".")[0], // to remove file extension
                        image_url: image.path,
                        grantha_id: grantha.grantha_id,
                      },
                    })
                    .catch((error) => {
                      throw new DataInsertionError(
                        `Failed to create scanned image ${
                          imgIndex + 1
                        } for main grantha in item ${itemIndex + 1}: ${
                          error.message
                        }`,
                        { itemIndex, imageIndex: imgIndex, image }
                      );
                    });

                  // Create Scanning Properties
                  await tx.scanningProperties
                    .create({
                      data: {
                        image_id: scannedImage.image_id,
                        worked_by: item.worked_by || "",
                        file_format: image.extension
                          ? image.extension.replace(".", "").toUpperCase()
                          : "UNKNOWN",
                        scanner_model: item.scanner_model || "Unknown",
                        resolution_dpi:
                          Array.isArray(image.dpi) && image.dpi.length > 0
                            ? String(image.dpi[0])
                            : "Unknown",
                        lighting_conditions: item.lighting_conditions || "",
                        color_depth: image.color_depth || "",
                        scanning_start_date: item.scanning_start_date || null,
                        scanning_completed_date:
                          item.scanning_completed_date || null,
                        post_scanning_completed_date:
                          item.post_scanning_completed_date || null,
                        horizontal_or_vertical_scan:
                          item.horizontal_or_vertical_scan || "",
                      },
                    })
                    .catch((error) => {
                      throw new DataInsertionError(
                        `Failed to create scanning properties for image ${
                          imgIndex + 1
                        } in item ${itemIndex + 1}: ${error.message}`,
                        {
                          itemIndex,
                          imageIndex: imgIndex,
                          imageId: scannedImage.image_id,
                        }
                      );
                    });
                }
              }

              // 6. Process Subworks
              if (item.subworks && Array.isArray(item.subworks)) {
                for (
                  let subIndex = 0;
                  subIndex < item.subworks.length;
                  subIndex++
                ) {
                  const subwork = item.subworks[subIndex];

                  if (
                    !subwork.grantha_id ||
                    !subwork.author ||
                    !subwork.language
                  ) {
                    throw new DataInsertionError(
                      `Missing required fields for subwork ${
                        subIndex + 1
                      } in item ${itemIndex + 1}`,
                      { itemIndex, subworkIndex: subIndex, subwork }
                    );
                  }

                  // Handle subwork author
                  let subworkAuthor = await tx.author
                    .findFirst({
                      where: {
                        author_name: {
                          equals: subwork.author.trim().toLowerCase(),
                          mode: "insensitive",
                        },
                      },
                    })
                    .catch((error) => {
                      throw new DataInsertionError(
                        `Failed to find subwork author for subwork ${
                          subIndex + 1
                        } in item ${itemIndex + 1}: ${error.message}`,
                        {
                          itemIndex,
                          subworkIndex: subIndex,
                          author: subwork.author,
                        }
                      );
                    });

                  if (!subworkAuthor) {
                    subworkAuthor = await tx.author
                      .create({
                        data: {
                          author_name: subwork.author.trim(),
                        },
                      })
                      .catch((error) => {
                        throw new DataInsertionError(
                          `Failed to create subwork author for subwork ${
                            subIndex + 1
                          } in item ${itemIndex + 1}: ${error.message}`,
                          {
                            itemIndex,
                            subworkIndex: subIndex,
                            author: subwork.author,
                          }
                        );
                      });
                  }

                  // Handle subwork language
                  let subworkLanguage = await tx.language
                    .findFirst({
                      where: {
                        language_name: {
                          equals: subwork.language.trim().toLowerCase(),
                          mode: "insensitive",
                        },
                      },
                    })
                    .catch((error) => {
                      throw new DataInsertionError(
                        `Failed to find subwork language for subwork ${
                          subIndex + 1
                        } in item ${itemIndex + 1}: ${error.message}`,
                        {
                          itemIndex,
                          subworkIndex: subIndex,
                          language: subwork.language,
                        }
                      );
                    });

                  if (!subworkLanguage) {
                    subworkLanguage = await tx.language
                      .create({
                        data: {
                          language_name: subwork.language.trim(),
                        },
                      })
                      .catch((error) => {
                        throw new DataInsertionError(
                          `Failed to create subwork language for subwork ${
                            subIndex + 1
                          } in item ${itemIndex + 1}: ${error.message}`,
                          {
                            itemIndex,
                            subworkIndex: subIndex,
                            language: subwork.language,
                          }
                        );
                      });
                  }

                  // Create Subwork Grantha
                  const subworkGrantha = await tx.grantha
                    .create({
                      data: {
                        grantha_id: subwork.grantha_id,
                        grantha_deck_id: granthaDeck.grantha_deck_id,
                        grantha_name: subwork.name || "",
                        language_id: subworkLanguage.language_id,
                        author_id: subworkAuthor.author_id,
                        remarks: item.remarks || "",
                        description: "",
                      },
                    })
                    .catch((error) => {
                      if (error.code === "P2002") {
                        // Unique constraint violation
                        throw new DataInsertionError(
                          `Duplicate subwork grantha ID: ${subwork.grantha_id}`,
                          {
                            itemIndex,
                            subworkIndex: subIndex,
                            field: "grantha_id",
                            value: subwork.grantha_id,
                          }
                        );
                      }
                      throw new DataInsertionError(
                        `Failed to create subwork grantha for subwork ${
                          subIndex + 1
                        } in item ${itemIndex + 1}: ${error.message}`,
                        {
                          itemIndex,
                          subworkIndex: subIndex,
                          grantha_id: subwork.grantha_id,
                        }
                      );
                    });

                  // Create Subwork ScannedImages
                  if (subwork.images && Array.isArray(subwork.images)) {
                    for (
                      let imgIndex = 0;
                      imgIndex < subwork.images.length;
                      imgIndex++
                    ) {
                      const image = subwork.images[imgIndex];

                      if (!image.name || !image.path) {
                        throw new DataInsertionError(
                          `Missing image name or path for subwork image ${
                            imgIndex + 1
                          } in subwork ${subIndex + 1} of item ${
                            itemIndex + 1
                          }`,
                          {
                            itemIndex,
                            subworkIndex: subIndex,
                            imageIndex: imgIndex,
                            image,
                          }
                        );
                      }

                      const scannedImage = await tx.scannedImage
                        .create({
                          data: {
                            image_name: image.name,
                            image_url: image.path,
                            grantha_id: subworkGrantha.grantha_id,
                          },
                        })
                        .catch((error) => {
                          throw new DataInsertionError(
                            `Failed to create subwork scanned image ${
                              imgIndex + 1
                            } for subwork ${subIndex + 1} in item ${
                              itemIndex + 1
                            }: ${error.message}`,
                            {
                              itemIndex,
                              subworkIndex: subIndex,
                              imageIndex: imgIndex,
                              image,
                            }
                          );
                        });

                      // Create Scanning Properties
                      await tx.scanningProperties
                        .create({
                          data: {
                            image_id: scannedImage.image_id,
                            worked_by: item.worked_by || "",
                            file_format: image.extension
                              ? image.extension.replace(".", "").toUpperCase()
                              : "UNKNOWN",
                            scanner_model: item.scanner_model || "Unknown",
                            resolution_dpi:
                              Array.isArray(image.dpi) && image.dpi.length > 0
                                ? String(image.dpi[0])
                                : "Unknown",
                            lighting_conditions: item.lighting_conditions || "",
                            color_depth: image.color_depth || "",
                            scanning_start_date:
                              item.scanning_start_date || null,
                            scanning_completed_date:
                              item.scanning_completed_date || null,
                            post_scanning_completed_date:
                              item.post_scanning_completed_date || null,
                            horizontal_or_vertical_scan:
                              item.horizontal_or_vertical_scan || "",
                          },
                        })
                        .catch((error) => {
                          throw new DataInsertionError(
                            `Failed to create subwork scanning properties for image ${
                              imgIndex + 1
                            } in subwork ${subIndex + 1} of item ${
                              itemIndex + 1
                            }: ${error.message}`,
                            {
                              itemIndex,
                              subworkIndex: subIndex,
                              imageIndex: imgIndex,
                              imageId: scannedImage.image_id,
                            }
                          );
                        });
                    }
                  }
                }
              }

              processedItems.push({
                itemIndex: itemIndex + 1,
                grantha_deck_id: granthaDeck.grantha_deck_id,
                grantha_id: grantha.grantha_id,
                status: "success",
              });
            } catch (error) {
              // Re-throw to trigger transaction rollback
              throw error;
            }
          }

          return {
            totalProcessed: processedItems.length,
            processedItems,
          };
        },
        {
          timeout: 120000, // 2 minutes timeout
          maxWait: 15000,
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      );

      // Clean up the temporary file
      if (csvFilePath && fs.existsSync(csvFilePath)) {
        fs.unlinkSync(csvFilePath);
      }

      return NextResponse.json(
        {
          message: "Bulk insertion completed successfully.",
          items_processed: result.totalProcessed,
          details: result.processedItems,
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error("Error processing data:", error);

      // Clean up the temporary file if it exists
      if (csvFilePath && fs.existsSync(csvFilePath)) {
        fs.unlinkSync(csvFilePath);
      }

      // Handle different types of errors
      if (error instanceof DataInsertionError) {
        return NextResponse.json(
          {
            error: `Data insertion failed: ${error.message}`,
            context: error.context,
            type: "data_insertion_error",
          },
          { status: 400 }
        );
      }

      if (error.code && error.code.startsWith("P")) {
        // Prisma error
        return NextResponse.json(
          {
            error: `Database error: ${error.message}`,
            code: error.code,
            type: "database_error",
          },
          { status: 500 }
        );
      }

      if (error.response) {
        // Axios error from Python backend
        return NextResponse.json(
          {
            error: `Python backend error: ${
              error.response.data.detail || error.response.statusText
            }`,
            type: "backend_error",
          },
          { status: error.response.status }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to process data",
          message: error.message || "Unknown error occurred",
          type: "unknown_error",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error processing request:", error);

    // Clean up the temporary file if it exists
    if (csvFilePath && fs.existsSync(csvFilePath)) {
      fs.unlinkSync(csvFilePath);
    }

    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        type: "request_error",
      },
      { status: 500 }
    );
  }
}
