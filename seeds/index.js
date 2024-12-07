const mongoose = require("mongoose");
const Hotel = require("../models/hotel");
const hotels = require("./hotels");

mongoose.connect("mongodb://localhost:27017/hotel");

mongoose.connection.on(
  "error",
  console.error.bind(console, "connection error:")
);
mongoose.connection.once("open", () => {
  console.log("connected to database");
});

const seedDB = async () => {
  await Hotel.deleteMany({});
  // const h = new Hotel({ Name: "test" });
  // await h.save();

  const generateImg = () => {
    return `https://picsum.photos/400?random=${Math.random()}`;
  };

  for (let h of hotels) {
    const images = [
      { url: h.Picture1 },
      { url: h.Picture2 },
      { url: h.Picture3 },
    ].filter((image) => image.url);
    const hotel = new Hotel({
      Author: "674ebbb73718d6838c78c2c1",
      Name: h.Name,
      Description: h.Description,
      Location: h.Add,
      LowestPrice: h.LowestPrice,
      CeilingPrice: h.CeilingPrice,
      Images: images,
      geometry: { type: "Point", coordinates: [h.Px, h.Py] },
    });
    await hotel.save();
  }
  console.log("DB seeded");
};

seedDB();
