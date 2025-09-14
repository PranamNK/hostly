const { ref } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
    title: {
    type: String,
    required : true
    },
    description: String,
    image: {
    filename: String,
    url: {
      type: String,
      default: "https://static.vecteezy.com/system/resources/thumbnails/049/546/770/small_2x/stunning-high-resolution-nature-and-landscape-backgrounds-breathtaking-scenery-in-hd-free-photo.jpg",
      set: (v) => v === ""? "https://static.vecteezy.com/system/resources/thumbnails/049/546/770/small_2x/stunning-high-resolution-nature-and-landscape-backgrounds-breathtaking-scenery-in-hd-free-photo.jpg" : v
      ,required: true
    }
    
  },
    price:{
    type: Number,
    required: true
    }, 
    location :{
    type: String,
    required: true
    },
    
    country: {
      type: String,
    },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
      
    },
  ],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
});

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;