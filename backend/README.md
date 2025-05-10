# Palm Leaf Project Backend

This directory contains the backend services for the Palm Leaf Project.

## Setup and Requirements

1. Make sure you have Python 3.8+ installed
2. Install the required packages:

```bash
pip install fastapi uvicorn pillow
```

## Running the Backend

You can start the backend server independently using:

```bash
cd backend
python main.py
```

Or use the npm script to run both frontend and backend:

```bash
npm run dev:all
```

## Bulk Insertion Feature

The bulk insertion feature allows users to process multiple Grantha entries from a CSV file and corresponding folder structure.

### CSV File Format

The CSV file should have the following columns:

- `S_NO`: Serial number
- `deck_origin`: Origin of the deck
- `deck_owner_name`: Name of the deck owner
- `deck_name`: Name of the deck (should match folder name)
- `grantha_name`: Main Grantha name in format `name:{author}-{language}`
- `subworks`: Comma-separated list of subworks in format `name:{author}-{language}`
- `scanning_start_date`: Start date of scanning
- `scanning_completed_date`: Completion date of scanning
- `post_scanning_completed_date`: Post-processing completion date
- `length`: Length in centimeters
- `width`: Width in centimeters
- `remarks`: Any remarks about the Grantha
- `stitch_or_nonstitch`: Whether the Grantha is stitched or not
- `condition`: Physical condition of the Grantha
- `horizontal_or_vertical_scan`: Scan orientation (H-Scan or V-Scan)

### Folder Structure

The folders base path should contain folders corresponding to each `deck_name` in the CSV.
Each folder should contain images for the main Grantha, and subfolders for each subwork mentioned.

Example:
```
/base_path/
  /TP_DEBU-0001/
    - image1.jpg
    - image2.jpg
    /Vishnu_Sahasranama/
      - sub_image1.jpg
    /Bhagavad_Gita/
      - sub_image2.jpg
  /TP_DEBU-0002/
    ...
```

### Using the Bulk Insertion Feature

1. Navigate to the Dashboard > Data > Insert page
2. Click on "Bulk Data Insertion" link at the bottom
3. Drag and drop or select your CSV file
4. Enter the folders base path
5. Click "Process and Insert"

The system will process the CSV, scan the folder structure, and insert all data into the database. 