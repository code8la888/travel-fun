const Hotel = require("../models/hotel");
const Review = require("../models/review");
module.exports.createReview = async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  const review = new Review(req.body.review);
  review.Author = req.user._id;
  hotel.Reviews.push(review);
  await review.save();
  await hotel.save();
  req.flash("success", "成功新增評論");
  res.redirect(`/hotels/${hotel._id}`);
};

module.exports.deleteReview = async (req, res) => {
  const { id, reviewId } = req.params;
  Hotel.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  req.flash("success", "成功刪除評論");
  res.redirect(`/hotels/${id}`);
};
