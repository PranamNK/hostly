// C:\hostly\updateGeo.js
import mongoose from "mongoose";
import axios from "axios";
import Listing from "./models/listing.js";   // ✅ imports real model

mongoose.connect("mongodb://127.0.0.1:27017/wanderLust")
  .then(() => console.log("✅ DB connected"))
  .catch(err => console.error(err));

const geocodeAndUpdate = async listing => {
  // Skip if coordinates already exist and are not [0,0]
  if (listing.geometry && listing.geometry.coordinates[0] !== 0 && listing.geometry.coordinates[1] !== 0) {
    return;
  }

  const query = encodeURIComponent(`${listing.location}, ${listing.country}`);

  try {
    const geoRes = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
    );

    if (geoRes.data.length > 0) {
      const coords = [
        parseFloat(geoRes.data[0].lon),
        parseFloat(geoRes.data[0].lat)
      ];

      listing.geometry = { type: "Point", coordinates: coords };
      await listing.save();   // ✅ persist change in DB

      console.log(`✅ Updated ${listing.title} → ${coords}`);
    } else {
      console.log(`⚠️ No geocoding result for ${listing.title} (${query})`);
    }
  } catch (err) {
    console.error(`❌ Geocoding failed for ${listing.title}:`, err.message);
  }
};

const run = async () => {
  const listings = await Listing.find({});
  for (let l of listings) {
    await geocodeAndUpdate(l);
  }
  console.log("🎉 All listings updated!");
  mongoose.connection.close();
};

run();
