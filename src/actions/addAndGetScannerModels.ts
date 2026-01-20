"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addScannerModel(scannerModel: String) {
  try {
    if (!scannerModel.trim()) {
      throw new Error("Scanner model name is required!");
    }
    const existingModel = await db.scannerModel.findFirst({
      where: {
        name: {
          equals: scannerModel.trim(),
          mode: "insensitive",
        },
      },
    });

    if (existingModel) {
      throw new Error("A Scanner model with this name already exists!");
    }

    const newScannerModel = await db.scannerModel.create({
      data: {
        name: scannerModel.trim(),
      },
    });

    // revalidatePath()

    return newScannerModel;
  } catch (error) {
    console.error("Error adding scanner model: ", error);
    throw error;
  }
}

export async function getScannerModels() {
  try {
    const scannerModels = await db.scannerModel.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return scannerModels;
  } catch (error) {
    console.error("Error fetching scanner models:", error);
    throw new Error("Failed to fetch scanner models");
  }
}

export async function deleteScannerModel(scannerModelId: string) {
  try {
    if (!scannerModelId) {
      throw new Error("Scanner model Id is required.");
    }

    await db.scannerModel.delete({
      where: {
        id: scannerModelId,
      },
    });

    // revalidatePath('/')

    return { success: true, message: "Scanner Model deleted successfully!" };
  } catch (error) {
    console.error("Error deleting scanner model:", error);
    throw new Error("Failed to delete scanner model");
  }
}

export async function updateScannerModel(id: string, name: string) {
  try {
    if (!id || !name.trim()) {
      throw new Error('Scanner model ID and name are required')
    }

    const existingModel = await db.scannerModel.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        },
        NOT: {
          id: id
        }
      }
    })

    if (existingModel) {
      throw new Error('A scanner model with this name already exists')
    }

    const updatedScannerModel = await db.scannerModel.update({
      where: {
        id: id
      },
      data: {
        name: name.trim()
      }
    })

    // revalidatePath('/scanner-models') // Adjust path as needed
    return updatedScannerModel
  } catch (error) {
    console.error('Error updating scanner model:', error)
    throw error
  }
}