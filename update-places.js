// update-places.js (ESM version)
import fs from 'fs';
import crypto from 'crypto';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, '_data', 'photographs.json');
const HASH_PATH = path.join(__dirname, '.photographs.json.hash');

function getFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18&addressdetails=1&accept-language=en`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'kennycx-portfolio-site/2.0 (hey@kenny.cx)' }
  });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const data = await res.json();
    const address = data.address || {};

      // Hierarchy: 1. Monuments/statues/event venues/etc, 2. Hotels/buildings/etc, 3. Roads/paths/etc
      // 1. Monuments/statues/event venues/etc
      const priority1 =
        address.monument ||
        address.memorial ||
        address.statue ||
        address.historic ||
        address.landmark ||
        address.place_of_worship ||
        address.attraction ||
        address.theatre ||
        address.stadium ||
        address.concert_hall ||
        address.cinema ||
        address.arts_centre ||
        address.events_venue;
      // 2. Hotels/buildings/etc
      const priority2 =
        address.hotel ||
        address.building ||
        address.tourism ||
        address.motel ||
        address.guest_house ||
        address.hostel ||
        address.cafe ||
        address.amenity;
      // 3. Roads/paths/etc
      const priority3 =
        address.cycleway ||
        address.footway ||
        address.pedestrian ||
        address.path ||
        address.road ||
        address.highway;

      // Try to get English name if available
      let notableName = null;
      if (data.namedetails) {
        notableName = data.namedetails["name:en"] || data.namedetails["int_name"] || data.namedetails.name;
      }

      let placeName = null;
      if (priority1) {
        placeName = notableName || priority1;
      } else if (priority2) {
        placeName = priority2;
      } else if (priority3) {
        placeName = priority3;
      }

      const city = address.city || address.town || address.village || address.hamlet || address.municipality || address.county || address.suburb || address.state_district;
      const country = address.country || '';
      let result = '';
      if (placeName && city && country) {
        result = `${placeName}, ${city}, ${country}`;
      } else if (city && country) {
        result = `${city}, ${country}`;
      } else if (country) {
        result = country;
      } else {
        result = data.display_name;
      }
      return result;
}

async function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error('photographs.json not found');
    process.exit(1);
  }
  const currentHash = getFileHash(DATA_PATH);
  let lastHash = '';
  if (fs.existsSync(HASH_PATH)) {
    lastHash = fs.readFileSync(HASH_PATH, 'utf-8').trim();
  }
  if (currentHash === lastHash) {
    console.log('No changes to photographs.json. Skipping geocoding.');
    return;
  }
  console.log('photographs.json changed. Updating place names...');
  const photos = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  let updated = false;
  for (const photo of photos) {
    if (photo.location && photo.location.latitude && photo.location.longitude) {
      // Only update if missing or changed
      if (!photo.locationName || photo.locationName === '' || photo._autoGeocode) {
        try {
          const name = await reverseGeocode(photo.location.latitude, photo.location.longitude);
          photo.locationName = name;
          photo._autoGeocode = true; // Mark as auto-generated
          updated = true;
          console.log(`Updated: ${photo.photoId} -> ${name}`);
        } catch (e) {
          console.error(`Failed to geocode ${photo.photoId}:`, e.message);
        }
      }
    }
  }
  if (updated) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(photos, null, 2));
    console.log('photographs.json updated with place names.');
  } else {
    console.log('No updates needed.');
  }
  fs.writeFileSync(HASH_PATH, currentHash);
}

main();
