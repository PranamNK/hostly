const Listing = require("../models/listing");
const axios = require("axios");

// helper function for geocoding
async function geocodeLocation(location, country) {
  const query = `${location}, ${country}`;
  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: { q: query, format: "json", limit: 1 },
      headers: { "User-Agent": "hostly-app (pranam@example.com)" }, // replace with your email
      timeout: 7000,
    });

    if (response.data.length > 0) {
      const lat = parseFloat(response.data[0].lat);
      const lon = parseFloat(response.data[0].lon);
      return [lon, lat];
    } else {
      console.warn(`No geocoding result for: ${query}`);
      return null;
    }
  } catch (err) {
    console.error("🌍 Geocoding failed:", err.message);
    return null;
  }
}

// smart fallback coordinates
function getFallbackCoords(country) {
  switch (country.toLowerCase()) {
    case "india":
      return [77.2090, 28.6139]; // New Delhi
    case "united states":
      return [-74.0060, 40.7128]; // New York
    case "canada":
      return [-106.3468, 56.1304]; // Canada center
    default:
      return [0, 0]; // ocean fallback
  }
}

// ---------------- Controllers ----------------

// Index
module.exports.index = async (req, res) => {
  const allListings = await Listing.find({}).populate("owner");
  res.render("listings/index", { allListings });
};

// Render new form
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// Show a single listing
module.exports.showListings = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author" },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing, currUser: req.user });
};

// Create listing
module.exports.createListing = async (req, res) => {
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;

  if (req.file) {
    newListing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  } else {
    newListing.image = {
      url: "/images/default.jpg",
      filename: "default",
    };
  }

  const coords = await geocodeLocation(newListing.location, newListing.country);
  newListing.geometry = {
    type: "Point",
    coordinates: coords || getFallbackCoords(newListing.country),
  };

  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
  console.log("✅ Created listing:", newListing.title, newListing.geometry);
};

// Render edit form
module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image
    ? listing.image.url.replace("/upload", "/upload/h_300,w_250")
    : "/images/default.jpg";

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

// Update listing
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  const coords = await geocodeLocation(listing.location, listing.country);
  listing.geometry = {
    type: "Point",
    coordinates: coords || getFallbackCoords(listing.country),
  };

  await listing.save();
  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${id}`);
  console.log("✏️ Updated listing:", listing.title, listing.geometry);
};

// Delete listing
module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log("🗑️ Deleted:", deletedListing?.title);
  req.flash("success", "Listing deleted!");
  res.redirect("/listings");
};
