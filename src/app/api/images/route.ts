import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Sharp } from 'sharp';

// Add sharp with types
import sharp from 'sharp';

export async function GET(request: Request) {
  try {
    // Get the image path from the query
    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get('path');
    const format = searchParams.get('format') || 'auto';

    if (!imagePath) {
      return new NextResponse('Image path is required', { status: 400 });
    }

    // Ensure the path exists
    if (!fs.existsSync(imagePath)) {
      return new NextResponse(`Image not found: ${imagePath}`, { status: 404 });
    }

    // Read the file using sharp
    let sharpImage: Sharp = sharp(imagePath);

    // Get file extension
    const ext = path.extname(imagePath).toLowerCase();
    
    // Default output format is jpeg
    let outputFormat = 'jpeg';
    let contentType = 'image/jpeg';
    
    // If format=auto, determine based on file extension, otherwise use specified format
    if (format === 'auto') {
      if (ext === '.png') {
        outputFormat = 'png';
        contentType = 'image/png';
      } else if (ext === '.webp') {
        outputFormat = 'webp';
        contentType = 'image/webp';
      } else if (ext === '.gif') {
        // For GIFs, let's read directly since sharp doesn't handle animated GIFs well
        const fileData = fs.readFileSync(imagePath);
        return new NextResponse(fileData, {
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      } else if (ext === '.svg') {
        // For SVGs, just return directly
        const fileData = fs.readFileSync(imagePath);
        return new NextResponse(fileData, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      }
      // For TIF, JPG, and others, use JPEG by default
    } else if (format === 'png') {
      outputFormat = 'png';
      contentType = 'image/png';
    } else if (format === 'webp') {
      outputFormat = 'webp';
      contentType = 'image/webp';
    }

    // Convert/process the image
    const imageBuffer = await sharpImage[outputFormat]().toBuffer();
    
    // Return the processed image
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400' // Cache for 1 day
      }
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse(`Error serving image: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}