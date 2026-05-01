import ExifReader from "exifreader";
import fs from "fs";

export const parseExifDate = (dateString) => {
  if (typeof dateString !== "string") return null;
  const match = dateString.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  return new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}`);
};

export const formatExifDate = (dateString) => {
  const parsedDate = parseExifDate(dateString);
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) return null;

  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(parsedDate);
  const day = new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(parsedDate);
  const year = new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(parsedDate);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsedDate);

  return `${month} ${day}, ${year} at ${time}`;
};

export const extractExif = (imagePath) => {
  try {
    if (!fs.existsSync(imagePath)) return null;

    const imageBuffer = fs.readFileSync(imagePath);
    const tags = ExifReader.load(imageBuffer);
    const exif = {};

    if (tags.Make?.description) exif.camera = tags.Make.description;
    if (tags.Model?.description) exif.model = tags.Model.description;
    const lensMake = tags.LensMake?.description;
    const lensModel = tags.LensModel?.description || tags.Lens?.description;
    if (lensMake || lensModel) {
      const lensCombined = [lensMake, lensModel].filter(Boolean).join(" ").trim();
      exif.lens = lensCombined;
    } else if (tags.LensSpecification?.description) {
      exif.lens = tags.LensSpecification.description;
    }
    if (tags.Software?.description) exif.software = tags.Software.description;
    if (tags.ISO?.description) exif.iso = tags.ISO.description;
    if (tags.FNumber?.description) exif.aperture = String(tags.FNumber.description).replace(/^f\//i, "");
    if (tags.ExposureTime?.description) exif.shutterSpeed = tags.ExposureTime.description;
    if (tags.FocalLength?.description) exif.focalLength = String(tags.FocalLength.description).replace(/\s*mm$/i, "");
    if (tags.DateTimeOriginal?.description) {
      exif.dateTimeOriginal = tags.DateTimeOriginal.description;
      exif.dateTimeFormatted = formatExifDate(tags.DateTimeOriginal.description) || tags.DateTimeOriginal.description;
    }

    if (typeof tags.GPSLatitude?.description !== "undefined" && typeof tags.GPSLongitude?.description !== "undefined") {
      exif.location = {
        latitude: String(tags.GPSLatitude.description),
        longitude: String(tags.GPSLongitude.description),
      };
    }

    // Attach the full EXIF tags as pretty-printed JSON for reference
    exif.exifRaw = JSON.stringify(tags, null, 2);
    return Object.keys(exif).length > 0 ? exif : null;
  } catch (error) {
    return null;
  }
};
