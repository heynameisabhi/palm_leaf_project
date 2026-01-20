-- CreateTable
CREATE TABLE "GranthaDeck" (
    "grantha_deck_id" TEXT NOT NULL,
    "grantha_deck_name" TEXT,
    "grantha_owner_name" TEXT,
    "grantha_source_address" TEXT,
    "length_in_cms" DOUBLE PRECISION,
    "width_in_cms" DOUBLE PRECISION,
    "total_leaves" INTEGER,
    "total_images" INTEGER,
    "stitch_or_nonstitch" TEXT,

    CONSTRAINT "GranthaDeck_pkey" PRIMARY KEY ("grantha_deck_id")
);

-- CreateTable
CREATE TABLE "Language" (
    "language_id" TEXT NOT NULL,
    "language_name" TEXT,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("language_id")
);

-- CreateTable
CREATE TABLE "Author" (
    "author_id" TEXT NOT NULL,
    "author_name" TEXT,
    "birth_year" TEXT,
    "death_year" TEXT,
    "bio" TEXT,
    "scribe_name" TEXT,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("author_id")
);

-- CreateTable
CREATE TABLE "Grantha" (
    "grantha_id" TEXT NOT NULL,
    "grantha_deck_id" TEXT NOT NULL,
    "grantha_name" TEXT,
    "language_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "description" TEXT,
    "remarks" TEXT,

    CONSTRAINT "Grantha_pkey" PRIMARY KEY ("grantha_id")
);

-- CreateTable
CREATE TABLE "UserAccount" (
    "user_id" TEXT NOT NULL,
    "user_name" TEXT,
    "password" TEXT,
    "role" TEXT,
    "phone_no" TEXT,
    "email" TEXT,
    "address" TEXT,

    CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "AccessControl" (
    "access_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "permission_level" TEXT,

    CONSTRAINT "AccessControl_pkey" PRIMARY KEY ("access_id")
);

-- CreateTable
CREATE TABLE "ScannedImage" (
    "image_id" TEXT NOT NULL,
    "image_url" TEXT,
    "grantha_id" TEXT NOT NULL,

    CONSTRAINT "ScannedImage_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "ScanningProperties" (
    "scan_id" TEXT NOT NULL,
    "image_id" TEXT NOT NULL,
    "worked_by" TEXT,
    "file_format" TEXT,
    "scanner_model" TEXT,
    "resolution_dpi" TEXT,
    "lighting_conditions" TEXT,
    "color_depth" TEXT,
    "scanning_start_date" TEXT,
    "scanning_completed_date" TEXT,
    "post_scanning_completed_date" TEXT,
    "horizontal_or_vertical_scan" TEXT,

    CONSTRAINT "ScanningProperties_pkey" PRIMARY KEY ("scan_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScanningProperties_image_id_key" ON "ScanningProperties"("image_id");

-- AddForeignKey
ALTER TABLE "Grantha" ADD CONSTRAINT "Grantha_grantha_deck_id_fkey" FOREIGN KEY ("grantha_deck_id") REFERENCES "GranthaDeck"("grantha_deck_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grantha" ADD CONSTRAINT "Grantha_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "Language"("language_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grantha" ADD CONSTRAINT "Grantha_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "Author"("author_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessControl" ADD CONSTRAINT "AccessControl_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserAccount"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScannedImage" ADD CONSTRAINT "ScannedImage_grantha_id_fkey" FOREIGN KEY ("grantha_id") REFERENCES "Grantha"("grantha_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanningProperties" ADD CONSTRAINT "ScanningProperties_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "ScannedImage"("image_id") ON DELETE CASCADE ON UPDATE CASCADE;
