const mongoose = require("mongoose");

const homeBannerSchema = mongoose.Schema({
  images: [{ type: String, required: true }],
});

homeBannerSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

homeBannerSchema.set("toJSON", {
  virtuals: true,
});

const HomeBanner = mongoose.model("HomeBanner", homeBannerSchema);
module.exports = HomeBanner;
