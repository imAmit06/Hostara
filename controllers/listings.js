const Listing = require("../models/listing");
const maptilerClient = require("@maptiler/client");
maptilerClient.config.apiKey = process.env.MAP_API;

const CATEGORY_FILTERS = [
  { name: "Trending", iconClass: "fa-solid fa-fire" },
  { name: "Rooms", iconClass: "fa-solid fa-bed" },
  { name: "Iconic Cities", iconClass: "fa-solid fa-monument" },
  { name: "Mountains", iconClass: "fa-solid fa-mountain" },
  { name: "Castles", iconClass: "fa-brands fa-fort-awesome" },
  { name: "Amazing Pools", iconClass: "fa-solid fa-person-swimming" },
  { name: "Camping", iconClass: "fa-solid fa-campground" },
  { name: "Farms", iconClass: "fa-solid fa-seedling" },
  { name: "Arctic", iconClass: "fa-solid fa-snowman" },
];

module.exports.index = async (req, res) => {
  const { category } = req.query;
  const activeCategory = CATEGORY_FILTERS.some(
    (filter) => filter.name === category,
  )
    ? category
    : null;
  const filterQuery = activeCategory ? { category: activeCategory } : {};
  const allListing = await Listing.find(filterQuery);

  const categoryFilters = CATEGORY_FILTERS.map((filter) => ({
    ...filter,
    href: `/listings?category=${encodeURIComponent(filter.name)}`,
    isActive: filter.name === activeCategory,
  }));

  res.render("listings/index.ejs", {
    allListing,
    categoryFilters,
    showClearFilters: Boolean(activeCategory),
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing does not exist.");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing, MAP_API: process.env.MAP_API });
};

module.exports.createListing = async (req, res, next) => {
  let url = req.file.path;
  let filename = req.file.filename;
  const result = await maptilerClient.geocoding.forward(
    req.body.listing.location,
    { limit: 1 },
  );
  const coords = result.features[0].geometry.coordinates;
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  newListing.geometry = {
    type: "Point",
    coordinates: coords,
  };
  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing does not exist.");
    return res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
