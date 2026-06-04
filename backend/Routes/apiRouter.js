const express = require("express");

const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genai = new GoogleGenerativeAI(process.env.OPENAI_API_KEY);
router.post("/generate-description", async (req, res) => {
  console.log("hello");
  try {
    const { Productname, category, brand, color, price, variants } = req.body;

    const model = genai.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
    });
    const prompt = `
Productname: ${Productname}
Category: ${category}
Brand: ${brand}
Color: ${color}
Price: ${price}
Variants:${JSON.stringify(variants || [])}
Write SEO friendly description in 50-60 words.`;
    const result = await model.generateContent(prompt);
    res.status(200).json({
      description: result.response.text(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
