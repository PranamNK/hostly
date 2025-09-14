const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js")
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("../schema.js");

const{validateReview, isLoggedIn} = require("../middleware.js");

const reviewController = require("../controllers/reviews.js")

//Post Reviews

router.post("/", 
    validateReview,
    isLoggedIn,
    wrapAsync(reviewController.createReview));

//Delete Review Rout
router.delete("/:reviewId", wrapAsync(reviewController.destroyReview)
);

module.exports = router;