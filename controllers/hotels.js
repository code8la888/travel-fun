const Hotel = require("../models/hotel");
const { cloudinary } = require("../cloudinary");
const maptilerClient = require("@maptiler/client");
maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;

module.exports.index = async (req, res) => {
  const hotels = await Hotel.find({});
  res.render("hotels/index", { hotels });
};

module.exports.renderNewForm = (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "請先登入");
    return res.redirect("/login");
  }
  res.render("hotels/new");
};

module.exports.createHotel = async (req, res, next) => {
  const geoData = await maptilerClient.geocoding.forward(
    req.body.hotel.Location,
    { limit: 1 }
  );
  const hotel = new Hotel(req.body.hotel);
  hotel.geometry = geoData.features[0].geometry;
  hotel.Images = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  hotel.Author = req.user._id;
  await hotel.save();
  console.log(hotel);
  req.flash("success", "成功新增飯店資料");
  res.redirect(`/hotels/${hotel._id}`);
};

module.exports.showHotel = async (req, res) => {
  const { id } = req.params;
  const hotel = await Hotel.findById(id)
    .populate({
      path: "Reviews",
      populate: {
        path: "Author",
      },
    })
    .populate("Author");

  if (!hotel) {
    req.flash("error", "找不到該飯店資訊");
    return res.redirect("/hotels");
  }
  res.render("hotels/show", { hotel });
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const hotel = await Hotel.findById(id);
  if (!hotel) {
    req.flash("error", "找不到該飯店資訊");
    return res.redirect("/hotels");
  }
  res.render("hotels/edit", { hotel });
};

module.exports.updateHotel = async (req, res) => {
  const { id } = req.params;
  const hotel = await Hotel.findByIdAndUpdate(id, { ...req.body.hotel });
  const geoData = await maptilerClient.geocoding.forward(
    req.body.hotel.Location,
    { limit: 1 }
  );
  hotel.geometry = geoData.features[0].geometry;
  const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  hotel.Images.push(...imgs);
  await hotel.save();
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await hotel.updateOne({
      $pull: { Images: { filename: { $in: req.body.deleteImages } } },
    });
  }
  req.flash("success", "成功更新飯店資料");
  res.redirect(`/hotels/${hotel._id}`);
};

module.exports.deleteHotel = async (req, res) => {
  const { id } = req.params;
  await Hotel.findByIdAndDelete(id);
  req.flash("success", "成功刪除飯店資料");
  res.redirect("/hotels");
};
