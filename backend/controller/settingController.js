const Setting = require("../models/Setting");

const getDefaultSettings = () => ({
  store: {
    name: "E-Shop Admin",
    logo: "",
    email: "admin@eshop.com",
    phone: "",
    address: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
    country: "India",
  },
  order: {
    allowCancellation: true,
    cancellationTime: 24,
    autoCancelUnpaid: true,
    unpaidCancellationTime: 30,
    minimumOrderAmount: 0,
    maximumOrderAmount: 100000,
  },
  shipping: {
    enabled: true,
    charge: 50,
    freeShipping: true,
    freeShippingAbove: 999,
    deliveryDays: 5,
    codCharge: 30,
  },
  payment: {
    onlinePayment: true,
    cod: true,
    razorpay: true,
    minimumCodAmount: 0,
    maximumCodAmount: 50000,
  },
  tax: {
    enabled: false,
    percentage: 18,
    inclusive: false,
  },
  customer: {
    registration: true,
    guestCheckout: true,
    emailVerification: false,
    phoneVerification: false,
    allowAccountDeletion: true,
  },
  notification: {
    newOrder: true,
    orderConfirmed: true,
    orderShipped: true,
    orderDelivered: true,
    orderCancelled: true,
    lowStock: true,
    email: true,
  },
  website: {
    title: "E-Shop - Your Online Store",
    description: "Discover amazing products at great prices",
    maintenanceMode: false,
    contactEmail: "support@eshop.com",
    contactPhone: "",
    footerText: "© 2024 E-Shop. All rights reserved.",
  },
});

const validateSettings = (settings) => {
  const errors = [];

  if (settings.store) {
    if (!settings.store.name?.trim()) {
      errors.push("Store name is required");
    }
    if (settings.store.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.store.email)) {
      errors.push("Invalid store email format");
    }
  }

  if (settings.order) {
    if (settings.order.cancellationTime !== undefined && settings.order.cancellationTime < 0) {
      errors.push("Cancellation time cannot be negative");
    }
    if (settings.order.unpaidCancellationTime !== undefined && settings.order.unpaidCancellationTime < 0) {
      errors.push("Unpaid cancellation time cannot be negative");
    }
    if (settings.order.minimumOrderAmount !== undefined && settings.order.minimumOrderAmount < 0) {
      errors.push("Minimum order amount cannot be negative");
    }
    if (
      settings.order.maximumOrderAmount !== undefined &&
      settings.order.minimumOrderAmount !== undefined &&
      settings.order.maximumOrderAmount < settings.order.minimumOrderAmount
    ) {
      errors.push("Maximum order amount must be greater than minimum order amount");
    }
  }

  if (settings.shipping) {
    if (settings.shipping.charge !== undefined && settings.shipping.charge < 0) {
      errors.push("Shipping charge cannot be negative");
    }
    if (settings.shipping.freeShippingAbove !== undefined && settings.shipping.freeShippingAbove < 0) {
      errors.push("Free shipping threshold cannot be negative");
    }
    if (settings.shipping.deliveryDays !== undefined && settings.shipping.deliveryDays < 0) {
      errors.push("Delivery days cannot be negative");
    }
    if (settings.shipping.codCharge !== undefined && settings.shipping.codCharge < 0) {
      errors.push("COD charge cannot be negative");
    }
  }

  if (settings.payment) {
    if (settings.payment.minimumCodAmount !== undefined && settings.payment.minimumCodAmount < 0) {
      errors.push("Minimum COD amount cannot be negative");
    }
    if (settings.payment.maximumCodAmount !== undefined && settings.payment.maximumCodAmount < 0) {
      errors.push("Maximum COD amount cannot be negative");
    }
    if (
      settings.payment.maximumCodAmount !== undefined &&
      settings.payment.minimumCodAmount !== undefined &&
      settings.payment.maximumCodAmount < settings.payment.minimumCodAmount
    ) {
      errors.push("Maximum COD amount must be greater than minimum COD amount");
    }
  }

  if (settings.tax) {
    if (settings.tax.percentage !== undefined && (settings.tax.percentage < 0 || settings.tax.percentage > 100)) {
      errors.push("Tax percentage must be between 0 and 100");
    }
  }

  return errors;
};

const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();

    if (!settings) {
      settings = await Setting.create(getDefaultSettings());
    }

    const safeSettings = settings.toObject();
    delete safeSettings.__v;

    res.status(200).json({
      success: true,
      data: safeSettings,
    });
  } catch (error) {
    console.error("❌ Get Settings Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateSettings = async (req, res) => {
  try {
    if (req.user?.Role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const validationErrors = validateSettings(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    let settings = await Setting.findOne();

    if (!settings) {
      settings = await Setting.create({ ...getDefaultSettings(), ...req.body });
    } else {
      Object.keys(req.body).forEach((section) => {
        if (settings[section] && typeof settings[section] === "object" && !Array.isArray(settings[section])) {
          settings[section] = { ...settings[section].toObject(), ...req.body[section] };
        }
      });
      await settings.save();
    }

    const updatedSettings = settings.toObject();
    delete updatedSettings.__v;

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: updatedSettings,
    });
  } catch (error) {
    console.error("❌ Update Settings Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};