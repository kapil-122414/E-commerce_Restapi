const express = require("express");
const router = express.Router();
const authmiddleware = require("../Middlerware/authmiddleware");
const { getSettings, updateSettings } = require("../controller/settingController");

router.get("/settings", authmiddleware, getSettings);
router.put("/settings", authmiddleware, updateSettings);

module.exports = router;