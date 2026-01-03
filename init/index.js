if (process.env.NODE_ENV != "production") {
  require("dotenv").config({ path: "../.env" });
}

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const MONGO_URL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderLust";

main()
  .then(() => {
    console.log("connected to db");
    initDB();
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});

  // Find a valid user to assign as owner
  let owner = await User.findOne({});
  if (!owner) {
    // Create a dummy user if none exists (fallback)
    const newUser = new User({ email: "admin@hostly.com", username: "admin" });
    owner = await User.register(newUser, "admin123");
    console.log("Created new admin user for ownership");
  }

  initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: owner._id,
  }));

  await Listing.insertMany(initData.data);
  console.log("Data was initialized");
  process.exit();
};