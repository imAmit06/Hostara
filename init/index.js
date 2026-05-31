const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
require("dotenv").config();
const MONGO_URL = process.env.MONGODB_URL;
const { geocoding, config } = require("@maptiler/client");
require("dotenv").config({ path: "../.env" });
config.apiKey = process.env.MAP_API;

//Connecting to DB
main()
  .then(() => {
    console.log("connected to mongodb");
  })
  .catch((err) => {
    console.log(err);
  });
async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  try {
    await Listing.deleteMany({});

    const listingsWithOwnerAndGeometry = [];

    for (let listing of initData.data) {
      const result = await geocoding.forward(
        `${listing.location}, ${listing.country}`,
        { limit: 1 },
      );

      let geometry = {
        type: "Point",
        coordinates: [0, 0],
      };

      if (result.features && result.features.length > 0) {
        geometry = result.features[0].geometry;
      }

      listingsWithOwnerAndGeometry.push({
        ...listing,
        owner: new mongoose.Types.ObjectId("6a14175ae606f0945502964e"),
        geometry,
      });
    }

    await Listing.insertMany(listingsWithOwnerAndGeometry);

    console.log("Data was initialized");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

initDB();
