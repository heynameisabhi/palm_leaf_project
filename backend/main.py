from fastapi import FastAPI
from pydantic import BaseModel
import os
from PIL import Image
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to ["http://localhost:3000"] for better security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FolderPathRequest(BaseModel):
    folder_path: str

def get_folder_structure(root_path):
    folder_structure = {"path": root_path, "files": [], "subfolders": []}

    for root, dirs, files in os.walk(root_path):
        current_folder = {"path": root, "files": [], "subfolders": []}

        for file in files:
            file_path = os.path.join(root, file)
            extension = os.path.splitext(file)[-1].lower()

            file_info = {
                "name": file,
                "path": file_path,  # ✅ get the ORIGINAL SYSTEM PATH
                "extension": extension,
                "size": os.path.getsize(file_path),
            }

            # Get image resolution and DPI of an image
            if extension in [".jpg", ".png", ".jpeg", ".webp", ".gif", ".tiff"]:
                try:
                    with Image.open(file_path) as img:
                        file_info["resolution"] = img.size  # (width, height)
                        file_info["dpi"] = img.info.get("dpi", "Unknown")  
                except Exception as e:
                    file_info["error"] = f"Could not process image: {str(e)}"

            current_folder["files"].append(file_info)

        # Process subfolders present inside the main folder
        for subdir in dirs:
            subfolder_path = os.path.join(root, subdir)
            subfolder_data = get_folder_structure(subfolder_path)
            current_folder["subfolders"].append(subfolder_data)

        if root == root_path:
            folder_structure = current_folder

    # Compute total images at the end to get the correct count of the images in the main folder
    total_images = sum(1 for f in folder_structure["files"])
    total_images += sum(subfolder["totalImages"] for subfolder in folder_structure["subfolders"])

    return {**folder_structure, "totalImages": total_images}

@app.post("/get-folder-details")
async def get_folder_details(data: FolderPathRequest):
    folder_path = data.folder_path.strip()

    if not os.path.exists(folder_path) or not os.path.isdir(folder_path):
        return {"error": "Invalid folder path"}

    folder_data = get_folder_structure(folder_path)

    return folder_data
