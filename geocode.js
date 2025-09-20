const Listing = require("../models/listing");
const axios = require("axios");

// Helper function to geocode a location
async function geocode(query) {
  try {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/search`,
      {
        params: { q: query, format: "json", limit: 1 },
        headers: {
          "User-Agent": "hostly-app (your-email@example.com)" // replace with your email
        },
        timeout: 5000
      }
    );
    if (res.data.length > 0) {
      return [
        parseFloat(res.data[0].lon),
        parseFloat(res.data[0].lat),
      ];
    } else {
      console.log(`No geocoding result for ${query}`);
      return null;
    }
  } catch (err) {
    console.error("Geocoding failed:", err.message);
    return null;
  }
}

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

  // Geocode the location
  const coords = await geocode(`${newListing.location}, ${newListing.country}`);
  if (coords) {
    newListing.geometry = { type: "Point", coordinates: coords };
  } else {
    // Fallback coordinates (center of India)
    newListing.geometry = { type: "Point", coordinates: [77.2090, 28.6139] };
  }

  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
  console.log("Body:", req.body);
  console.log("File:", req.file);
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

  // Update map coordinates if location or country changed
  const coords = await geocode(`${listing.location}, ${listing.country}`);
  if (coords) {
    listing.geometry = { type: "Point", coordinates: coords };
  } else {
    // Fallback coordinates (center of India)
    listing.geometry = { type: "Point", coordinates: [77.2090, 28.6139] };
  }

  await listing.save();

  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${id}`);
};

// Delete listing
module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log("Deleted:", deletedListing);
  req.flash("success", "Listing deleted!");
  res.redirect("/listings");
};
