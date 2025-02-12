const BaseJoi = require("joi");
const sanitizeHtml = require("sanitize-html");

const extension = (joi) => ({
  type: "string",
  base: joi.string(),
  messages: {
    "string.escapeHTML": "{{#label}} must not include HTML!",
  },
  rules: {
    escapeHTML: {
      validate(value, helpers) {
        const clean = sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {},
        });
        if (clean !== value)
          return helpers.error("string.escapeHTML", { value });
        return clean;
      },
    },
  },
});

const Joi = BaseJoi.extend(extension);

module.exports.hotelSchema = Joi.object({
  hotel: Joi.object({
    Name: Joi.string().required().escapeHTML(),
    Location: Joi.string().required().escapeHTML(),
    Description: Joi.string().required().escapeHTML(),
    LowestPrice: Joi.number().required().min(0),
    CeilingPrice: Joi.number().required().min(Joi.ref("LowestPrice")),
    Serviceinfo: Joi.string().required().escapeHTML(),
    Parkinginfo: Joi.string().required().escapeHTML(),
    Tel: Joi.string().required().escapeHTML(),
    Website: Joi.string().required().escapeHTML(),
  }).required(),
  deleteImages: Joi.array(),
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    body: Joi.string().required().escapeHTML(),
  }).required(),
});
