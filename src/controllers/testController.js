const userModel = require("../models/testModel");

const getTestDataController = async (req, res) => {
  try {
    const testData = await userModel.getTestData();
    res.json(testData);
  } catch (error) {
    console.error("Error getting user data:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  getTestDataController,
};
