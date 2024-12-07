const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review");
const User = require("./user");
const { required } = require("joi");
const { coordinates } = require("@maptiler/client");

const ImageSchema = new Schema({
  url: String,
  filename: String,
});

ImageSchema.virtual("thumbnail").get(function () {
  return this.url.replace("/upload", "/upload/w_100");
});

const opts = { toJSON: { virtuals: true } };

const hotelSchema = new Schema(
  {
    Name: String,
    LowestPrice: Number,
    CeilingPrice: Number,
    Description: String,
    Location: String,
    Images: [ImageSchema],
    Author: {
      type: Schema.Types.ObjectId,
      ref: User,
    },
    Reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: Review,
      },
    ],
    geometry: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  opts
);

hotelSchema.virtual("properties.popUpMarkup").get(function () {
  return `<strong><a href="/hotels/${this._id}">${this.Name}</a></strong>
  <p>${this.Description.substring(0, 50)}...</p>`;
});

hotelSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await Review.deleteMany({ _id: { $in: doc.Reviews } });
  }
});

module.exports = mongoose.model("Hotel", hotelSchema);
