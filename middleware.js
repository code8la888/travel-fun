const Hotel = require("./models/hotel");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError");
const { hotelSchema, reviewSchema } = require("./schemas.js");

module.exports.storeReturnTo = (req, res, next) => {
  if (req.session.returnTo) {
    res.locals.returnTo = req.session.returnTo;
  }
  next();
};

module.exports.isLoggedIn = (req, res, next) => {
  // console.log("REQ.USER...", req.user);
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;

    req.flash("error", "請先登入");
    return res.redirect("/login");
  }
  next();
};

module.exports.validateHotel = (req, res, next) => {
  const { error } = hotelSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

module.exports.isAuthor = async (req, res, next) => {
  const { id } = req.params;
  const hotel = await Hotel.findById(id);

  if (!hotel.Author.equals(req.user._id)) {
    req.flash("error", "您沒有權限進行此操作");
    res.redirect(`/hotels/${id}`);
  }
  next();
};

module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);

  if (!review.Author.equals(req.user._id)) {
    req.flash("error", "您沒有權限進行此操作");
    return res.redirect(`/hotels/${id}`);
  }
  next();
};
