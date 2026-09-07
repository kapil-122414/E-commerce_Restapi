const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    store: {
      name: {
        type: String,
        default: "E-Shop Admin",
      },
      logo: {
        type: String,
        default: "",
      },
      email: {
        type: String,
        default: "admin@eshop.com",
      },
      phone: {
        type: String,
        default: "",
      },
      address: {
        type: String,
        default: "",
      },
      currency: {
        type: String,
        default: "INR",
      },
      timezone: {
        type: String,
        default: "Asia/Kolkata",
      },
      country: {
        type: String,
        default: "India",
      },
    },

    order: {
      allowCancellation: {
        type: Boolean,
        default: true,
      },
      cancellationTime: {
        type: Number,
        default: 24,
      },
      autoCancelUnpaid: {
        type: Boolean,
        default: true,
      },
      unpaidCancellationTime: {
        type: Number,
        default: 30,
      },
      minimumOrderAmount: {
        type: Number,
        default: 0,
      },
      maximumOrderAmount: {
        type: Number,
        default: 100000,
      },
    },

    shipping: {
      enabled: {
        type: Boolean,
        default: true,
      },
      charge: {
        type: Number,
        default: 50,
      },
      freeShipping: {
        type: Boolean,
        default: true,
      },
      freeShippingAbove: {
        type: Number,
        default: 999,
      },
      deliveryDays: {
        type: Number,
        default: 5,
      },
      codCharge: {
        type: Number,
        default: 30,
      },
    },

    payment: {
      onlinePayment: {
        type: Boolean,
        default: true,
      },
      cod: {
        type: Boolean,
        default: true,
      },
      razorpay: {
        type: Boolean,
        default: true,
      },
      minimumCodAmount: {
        type: Number,
        default: 0,
      },
      maximumCodAmount: {
        type: Number,
        default: 50000,
      },
    },

    tax: {
      enabled: {
        type: Boolean,
        default: false,
      },
      percentage: {
        type: Number,
        default: 18,
      },
      inclusive: {
        type: Boolean,
        default: false,
      },
    },

    customer: {
      registration: {
        type: Boolean,
        default: true,
      },
      guestCheckout: {
        type: Boolean,
        default: true,
      },
      emailVerification: {
        type: Boolean,
        default: false,
      },
      phoneVerification: {
        type: Boolean,
        default: false,
      },
      allowAccountDeletion: {
        type: Boolean,
        default: true,
      },
    },

    notification: {
      newOrder: {
        type: Boolean,
        default: true,
      },
      orderConfirmed: {
        type: Boolean,
        default: true,
      },
      orderShipped: {
        type: Boolean,
        default: true,
      },
      orderDelivered: {
        type: Boolean,
        default: true,
      },
      orderCancelled: {
        type: Boolean,
        default: true,
      },
      lowStock: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: true,
      },
    },

    website: {
      title: {
        type: String,
        default: "E-Shop - Your Online Store",
      },
      description: {
        type: String,
        default: "Discover amazing products at great prices",
      },
      maintenanceMode: {
        type: Boolean,
        default: false,
      },
      contactEmail: {
        type: String,
        default: "support@eshop.com",
      },
      contactPhone: {
        type: String,
        default: "",
      },
      footerText: {
        type: String,
        default: "© 2024 E-Shop. All rights reserved.",
      },
    },
  },
  {
    timestamps: true,
  }
);

settingSchema.index({}, { unique: true });

module.exports = mongoose.model("Setting", settingSchema);