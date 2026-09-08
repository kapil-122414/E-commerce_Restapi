const { body, param, query, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

const registerValidation = [
  body("Email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("Password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character"),
  handleValidationErrors,
];

const loginValidation = [
  body("Email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("Password")
    .notEmpty()
    .withMessage("Password is required"),
  handleValidationErrors,
];

const categoryValidation = [
  body("Categoryname")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ max: 100 })
    .withMessage("Category name too long"),
  body("Slug")
    .trim()
    .notEmpty()
    .withMessage("Slug is required")
    .matches(/^[a-z0-9-]+$/)
    .withMessage("Slug can only contain lowercase letters, numbers, and hyphens"),
  body("Status")
    .isIn(["active", "inactive"])
    .withMessage("Status must be active or inactive"),
  handleValidationErrors,
];

const productValidation = [
  body("Productname")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ max: 200 })
    .withMessage("Product name too long"),
  body("Description")
    .trim()
    .notEmpty()
    .withMessage("Description is required"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("mrp")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("MRP must be a positive number"),
  body("stock")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("discount")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Discount must be between 0 and 100"),
  body("categoryId")
    .isMongoId()
    .withMessage("Valid category ID is required"),
  body("brand")
    .optional()
    .isMongoId()
    .withMessage("Valid brand ID required"),
  handleValidationErrors,
];

const brandValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Brand name is required")
    .isLength({ max: 100 })
    .withMessage("Brand name too long"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be active or inactive"),
  handleValidationErrors,
];

const cartValidation = [
  body("ProductId")
    .isMongoId()
    .withMessage("Valid product ID is required"),
  body("Quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("variants")
    .optional()
    .isObject()
    .withMessage("Variants must be an object"),
  handleValidationErrors,
];

const orderValidation = [
  body("shippingaddress")
    .isObject()
    .withMessage("Shipping address is required"),
  body("shippingaddress.name")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),
  body("shippingaddress.Phoneno")
    .matches(/^\d{10}$/)
    .withMessage("Valid 10-digit phone number is required"),
  body("shippingaddress.address")
    .trim()
    .notEmpty()
    .withMessage("Address is required"),
  body("shippingaddress.city")
    .trim()
    .notEmpty()
    .withMessage("City is required"),
  body("shippingaddress.state")
    .trim()
    .notEmpty()
    .withMessage("State is required"),
  body("shippingaddress.pinecode")
    .matches(/^\d{6}$/)
    .withMessage("Valid 6-digit pincode is required"),
  body("shippingCost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping cost must be a positive number"),
  body("discount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount must be a positive number"),
  handleValidationErrors,
];

const mongoIdParam = [
  param("id")
    .isMongoId()
    .withMessage("Valid ID is required"),
  handleValidationErrors,
];

const mongoIdParamOptional = (paramName = "id") => [
  param(paramName)
    .optional()
    .isMongoId()
    .withMessage(`Valid ${paramName} is required`),
  handleValidationErrors,
];

const paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  categoryValidation,
  productValidation,
  brandValidation,
  cartValidation,
  orderValidation,
  mongoIdParam,
  mongoIdParamOptional,
  paginationValidation,
  handleValidationErrors,
};