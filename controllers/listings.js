const Listing = require("../models/listing");
const axios = require("axios");

// Index
// Index
module.exports.index = async (req, res) => {
  const { category } = req.query;
  let allListings;
  if (category) {
    allListings = await Listing.find({ category }).populate("owner");
  } else {
    allListings = await Listing.find({}).populate("owner");
  }
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
    // Cloudinary upload
    newListing.image = {
      url: req.file.path,      // Cloudinary gives FULL URL here
      filename: req.file.filename,
    };
  } else {
    // Fallback if no image uploaded
    newListing.image = {
      url: "/images/default.jpg", // make sure this exists in public/images/
      filename: "default",
    };
  }

  //  Geocode the location
  const query = encodeURIComponent(`${newListing.location}, ${newListing.country}`);
  try {
    const geoRes = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
    );

    if (geoRes.data.length > 0) {
      const coords = [
        parseFloat(geoRes.data[0].lon),
        parseFloat(geoRes.data[0].lat),
      ];
      newListing.geometry = { type: "Point", coordinates: coords };
    } else {
      console.log(`No geocoding result for ${query}`);
      newListing.geometry = { type: "Point", coordinates: [0, 0] };
    }
  } catch (err) {
    console.error("Geocoding failed:", err.message);
    newListing.geometry = { type: "Point", coordinates: [0, 0] };
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

  // Safe check for image
  let originalImageUrl = listing.image
    ? listing.image.url.replace("/upload", "/upload/h_300,w_250")
    : "/images/default.jpg";

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

// Update listing
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

  // Update image if uploaded
  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  // Update map coordinates if location or country is changed
  const axios = require("axios");
  const query = encodeURIComponent(`${listing.location}, ${listing.country}`);
  try {
    const geoRes = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
    );
    if (geoRes.data.length > 0) {
      const coords = [parseFloat(geoRes.data[0].lon), parseFloat(geoRes.data[0].lat)];
      listing.geometry = { type: "Point", coordinates: coords };
    } else {
      console.log(`No geocoding result for ${query}`);
    }
  } catch (err) {
    req.flash("error", err.message);
    console.error("Geocoding failed:", err.message);
  }

  await listing.save();

  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${id}`);
};


// Delete listingor else 
module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log("Deleted:", deletedListing);
  req.flash("success", "Listing deleted!");
  res.redirect("/listings");
};
