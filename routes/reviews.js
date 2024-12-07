const express = require("express");
const router = express.Router({ mergeParams: true });
const Review = require("../controllers/reviews");
const catchAsync = require("../utils/catchAsync");

const { isLoggedIn, isReviewAuthor, validateReview } = require("../middleware");

router.post("/", isLoggedIn, validateReview, catchAsync(Review.createReview));

router.delete(
  "/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  catchAsync(Review.deleteReview)
);

module.exports = router;
