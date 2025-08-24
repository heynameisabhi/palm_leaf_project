from fastapi import FastAPI
from pydantic import BaseModel
import os
from PIL import Image
from fastapi.middleware.cors import CORSMiddleware
from bulk_insertion import add_bulk_insertion_routes, get_color_depth, is_valid_image_file, is_valid_directory
import re

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FolderPathRequest(BaseModel):
    folder_path: str


# Helper function to make DPI values JSON serializable
def make_dpi_serializable(dpi_value):
    if dpi_value is None:
        return None
    try:
        if isinstance(dpi_value, tuple):
            return tuple(float(x) if hasattr(x, "__float__") else x for x in dpi_value)
        elif hasattr(dpi_value, "__float__"):
            return float(dpi_value)
        else:
            return "Unknown"
    except Exception:
        return "Unknown"

def get_folder_structure(root_path):
    """Get folder structure with enhanced filtering of hidden files and directories"""
    folder_structure = {"path": root_path, "files": [], "subfolders": []}

    try:
        for root, dirs, files in os.walk(root_path):
            current_folder = {"path": root, "files": [], "subfolders": []}

            # Filter out invalid directories in-place with detailed logging
            original_dirs = dirs.copy()
            dirs[:] = [d for d in dirs if is_valid_directory(d)]
            filtered_out_dirs = set(original_dirs) - set(dirs)
            if filtered_out_dirs:
                print(f"[DEBUG] Filtered out directories: {filtered_out_dirs}")

            # Process files with enhanced filtering
            valid_files_count = 0
            for file in files:
                # Skip files that don't pass our enhanced validation
                if not is_valid_image_file(file):
                    continue

                file_path = os.path.join(root, file)
                
                # Additional check: Skip if file is actually hidden (system attribute on Windows)
                if os.name == 'nt':  # Windows
                    import stat
                    try:
                        attrs = os.stat(file_path).st_file_attributes
                        if attrs & stat.FILE_ATTRIBUTE_HIDDEN:
                            print(f"[DEBUG] Skipping Windows hidden file: {file}")
                            continue
                    except (AttributeError, OSError):
                        pass  # Ignore if we can't check attributes
                
                extension = os.path.splitext(file)[-1].lower()

                file_info = {
                    "name": file,
                    "path": file_path,
                    "extension": extension,
                    "size": os.path.getsize(file_path),
                }

                # Process image files that passed validation
                if extension in [".jpg", ".png", ".jpeg", ".webp", ".gif", ".tiff", ".tif", ".dng", ".bmp", ".raw"]:
                    try:
                        with Image.open(file_path) as img:
                            file_info["resolution"] = img.size  # (width, height)
                            file_info["dpi"] = make_dpi_serializable(img.info.get("dpi"))
                            file_info["color_depth"] = get_color_depth(img)  # ✅ Add color depth
                            
                            # Only add to results if PIL can successfully process it
                            current_folder["files"].append(file_info)
                            valid_files_count += 1
                            print(f"[DEBUG] Added valid image: {file}")
                            
                    except Exception as e:
                        print(f"[DEBUG] Skipping {file}: PIL error - {str(e)}")
                        # Don't add files that can't be opened by PIL
                else:
                    # For non-image files that passed validation, add without image processing
                    current_folder["files"].append(file_info)
                    valid_files_count += 1

            print(f"[DEBUG] Processed {valid_files_count} valid files in {root}")

            # Recursively process valid subfolders only
            valid_subdirs = [d for d in dirs if is_valid_directory(d)]
            for subdir in valid_subdirs:
                subfolder_path = os.path.join(root, subdir)
                subfolder_data = get_folder_structure(subfolder_path)
                current_folder["subfolders"].append(subfolder_data)

            if root == root_path:
                folder_structure = current_folder

        # Count total images in this folder and all subfolders (only valid images)
        valid_image_extensions = [".jpg", ".png", ".jpeg", ".webp", ".gif", ".tiff", ".tif", ".dng", ".bmp", ".raw"]
        total_images = sum(
            1 for f in folder_structure["files"]
            if os.path.splitext(f["name"])[-1].lower() in valid_image_extensions
        )
        for subfolder in folder_structure.get("subfolders", []):
            total_images += subfolder.get("totalImages", 0)

        print(f"[DEBUG] Total valid images found: {total_images}")
        return {**folder_structure, "totalImages": total_images}
        
    except Exception as e:
        print(f"[ERROR] Error processing folder structure for {root_path}: {str(e)}")
        return {"path": root_path, "files": [], "subfolders": [], "totalImages": 0}

@app.post("/get-folder-details")
async def get_folder_details(data: FolderPathRequest):
    folder_path = data.folder_path.strip()

    if not os.path.exists(folder_path) or not os.path.isdir(folder_path):
        return {"error": "Invalid folder path"}

    try:
        folder_data = get_folder_structure(folder_path)
        return folder_data
    except Exception as e:
        return {"error": f"Error processing folder: {str(e)}"}

# Add the bulk insertion routes from separate file
add_bulk_insertion_routes(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)