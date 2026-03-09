import Diversification from "../../models/net-worth/diversification.js";

// logic for getting all diversification from database
export const fetch = async (req, res) => {
  try {
    const diversification = await Diversification.find();
    res.status(200).json({
      success: true,
      code: 200,
      data: diversification,
    });
  } catch (error) {
    res.status(500).json({
      error: {
        success: false,
        code: 500,
        message: "Internal server error",
      },
    });
  }
};

// logic for creating new diversification from database
export const create = async (req, res) => {
  try {
    const diversificationData = new Diversification(req.body);
    const savedDiversification = await diversificationData.save();
    res.status(200).json({
      success: true,
      code: 200,
      data: savedDiversification,
    });
  } catch (error) {
    res.status(500).json({
      error: {
        success: false,
        code: 500,
        message: "Internal server error",
      },
    });
  }
};

// logic for update a diversification
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    const diversificationExist = await Diversification.findOne({ _id: id });
    if (!diversificationExist) {
      return res.status(404).json({
        success: true,
        code: 404,
        message: "Diversification not found",
      });
    }
    const updatedDiversification = await Diversification.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
      }
    );
    res.status(200).json({
      success: true,
      code: 200,
      data: updatedDiversification,
    });
  } catch (error) {
    res.status(500).json({
      error: {
        success: false,
        code: 500,
        message: "Internal server error",
      },
    });
  }
};

// logic for delete a diversification from database
export const deleteDiversification = async (req, res) => {
  try {
    const id = req.params.id;
    const diversificationExist = await Diversification.findOne({ _id: id });
    if (!diversificationExist) {
      return res.status(404).json({
        success: true,
        code: 404,
        message: "Diversification not found",
      });
    }

    await Diversification.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      code: 200,
      message: "Diversification Successfully Deleted",
    });
  } catch (error) {
    res.status(500).json({
      error: {
        success: false,
        code: 500,
        message: "Internal server error",
      },
    });
  }
};
