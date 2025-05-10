from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import csv
from PIL import Image
from typing import List, Dict, Any, Optional
import re

class CSVProcessRequest(BaseModel):
    csv_file_path: str
    folders_base_path: str

# Helper function to make DPI values JSON serializable
def make_dpi_serializable(dpi_value):
    if dpi_value is None:
        return None
    
    try:
        # Handle tuple of IFDRational objects
        if isinstance(dpi_value, tuple):
            return tuple(float(x) if hasattr(x, "__float__") else x for x in dpi_value)
        # Handle single IFDRational
        elif hasattr(dpi_value, "__float__"):
            return float(dpi_value)
        else:
            return "Unknown"
    except Exception:
        return "Unknown"

def get_folder_structure(root_path):
    folder_structure = {"path": root_path, "files": [], "subfolders": []}

    for root, dirs, files in os.walk(root_path):
        current_folder = {"path": root, "files": [], "subfolders": []}

        for file in files:
            file_path = os.path.join(root, file)
            extension = os.path.splitext(file)[-1].lower()

            file_info = {
                "name": file,
                "path": file_path,  # Original system path
                "extension": extension,
                "size": os.path.getsize(file_path),
            }

            # Get image resolution and DPI of an image
            if extension in [".jpg", ".png", ".jpeg", ".webp", ".gif", ".tiff", ".tif", ".dng"]:
                try:
                    with Image.open(file_path) as img:
                        file_info["resolution"] = img.size  # (width, height)
                        # Handle DPI values to make them JSON serializable
                        dpi = img.info.get("dpi")
                        file_info["dpi"] = make_dpi_serializable(dpi)
                except Exception as e:
                    file_info["error"] = f"Could not process image: {str(e)}"
                    file_info["resolution"] = None
                    file_info["dpi"] = None

            current_folder["files"].append(file_info)

        # Process subfolders present inside the main folder
        for subdir in dirs:
            subfolder_path = os.path.join(root, subdir)
            subfolder_data = get_folder_structure(subfolder_path)
            current_folder["subfolders"].append(subfolder_data)

        if root == root_path:
            folder_structure = current_folder

    # Compute total images at the end to get the correct count of the images in the main folder
    total_images = sum(1 for f in folder_structure["files"] 
                     if os.path.splitext(f["name"])[-1].lower() in 
                     [".jpg", ".png", ".jpeg", ".webp", ".gif", ".tiff", ".tif", ".dng"])
    
    # Sum the total images from subfolders
    for subfolder in folder_structure.get("subfolders", []):
        total_images += subfolder.get("totalImages", 0)

    return {**folder_structure, "totalImages": total_images}

def parse_grantha_info(grantha_text):
    """Parse grantha text in the format 'grantha_name:{author_name}-{language}'"""
    # Handle spaces around : and -
    pattern = r"(.+?)\s*:\s*\{(.+?)\}\s*-\s*\{(.+?)\}"
    match = re.match(pattern, grantha_text.strip())
    
    if match:
        return {
            "name": match.group(1).strip(),
            "author": match.group(2).strip(),
            "language": match.group(3).strip()
        }
    return {
        "name": grantha_text.strip(),
        "author": "Unknown",
        "language": "Unknown"
    }

def parse_subworks(subworks_text):
    """Parse subworks text which contains multiple grantha information separated by commas"""
    subworks = []
    # Split by commas but handle potential spaces
    for subwork in re.split(r'\s*,\s*', subworks_text.strip()):
        if subwork:
            subworks.append(parse_grantha_info(subwork))
    return subworks

def process_csv(app, csv_path, folders_base_path):
    """Process the CSV file and retrieve information about granthas and subworks."""
    if not os.path.exists(csv_path) or not os.path.isfile(csv_path):
        raise HTTPException(status_code=400, detail="Invalid CSV file path")
        
    if not os.path.exists(folders_base_path) or not os.path.isdir(folders_base_path):
        raise HTTPException(status_code=400, detail="Invalid folders base path")
    
    result = []
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            
            for row in csv_reader:
                # Process each row
                deck_name = row.get('deck_name', '').strip()
                grantha_info = parse_grantha_info(row.get('grantha_name', ''))
                
                # Generate grantha_id
                grantha_id = f"{deck_name}_{grantha_info['name'].replace(' ', '_')}"
                
                # Get subfolder information
                folder_path = os.path.join(folders_base_path, deck_name)
                folder_data = {}
                
                if os.path.exists(folder_path) and os.path.isdir(folder_path):
                    folder_data = get_folder_structure(folder_path)
                
                # Parse subworks
                subworks_info = parse_subworks(row.get('subworks', ''))
                
                # Initialize image lists for main grantha and subworks
                main_grantha_images = []
                subworks_with_images = []
                
                if folder_data:
                    # Images directly in the main folder belong to the main grantha
                    for file_info in folder_data.get("files", []):
                        extension = file_info.get("extension", "").lower()
                        if extension in [".jpg", ".png", ".jpeg", ".webp", ".gif", ".tiff", ".tif", ".dng"]:
                            main_grantha_images.append(file_info)
                    
                    # Process subfolders and their images
                    subfolders = folder_data.get("subfolders", [])
                    
                    # Map subworks to actual subfolders
                    for i, subwork in enumerate(subworks_info):
                        if i < len(subfolders):
                            subfolder = subfolders[i]
                            subfolder_name = os.path.basename(subfolder.get("path"))
                            
                            # Add subfolder name and ID to subwork info
                            subwork["folder_name"] = subfolder_name
                            subwork["grantha_id"] = f"{deck_name}_{subfolder_name}"
                            
                            # Add images from this subfolder to the subwork
                            subwork_images = []
                            for file_info in subfolder.get("files", []):
                                extension = file_info.get("extension", "").lower()
                                if extension in [".jpg", ".png", ".jpeg", ".webp", ".gif", ".tiff", ".tif", ".dng"]:
                                    subwork_images.append(file_info)
                            
                            # Include images that belong to this subwork
                            subwork["images"] = subwork_images
                            subwork["image_count"] = len(subwork_images)
                            
                            subworks_with_images.append(subwork)
                
                row_result = {
                    "s_no": row.get('S_NO', ''),
                    "deck_origin": row.get('deck_origin', ''),
                    "deck_owner_name": row.get('deck_owner_name', ''),
                    "deck_name": deck_name,
                    "grantha_id": grantha_id,
                    "stitch_or_nonstitch": row.get('stitch_or_nonstitch', ''),
                    "physical_condition": row.get('condition', ''),
                    "length_in_cms": float(row.get('length', 0)) if row.get('length') else 0,
                    "width_in_cms": float(row.get('width', 0)) if row.get('width') else 0,
                    "scanning_start_date": row.get('scanning_start_date', ''),
                    "scanning_completed_date": row.get('scanning_completed_date', ''),
                    "post_scanning_completed_date": row.get('post_scanning_completed_date', ''),
                    "horizontal_or_vertical_scan": row.get('horizontal_or_vertical_scan', ''),
                    "remarks": row.get('remarks', ''),
                    "grantha": {
                        "id": grantha_id,
                        "name": grantha_info["name"],
                        "author": grantha_info["author"],
                        "language": grantha_info["language"],
                        "images": main_grantha_images,
                        "image_count": len(main_grantha_images)
                    },
                    "subworks": subworks_with_images,
                    "total_images": folder_data.get("totalImages", 0)
                }
                
                result.append(row_result)
                
        return {"status": "success", "data": result}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")

def add_bulk_insertion_routes(app):
    @app.post("/process-csv")
    async def api_process_csv(request: CSVProcessRequest):
        csv_path = request.csv_file_path.strip()
        folders_base_path = request.folders_base_path.strip()
        
        return process_csv(app, csv_path, folders_base_path) 