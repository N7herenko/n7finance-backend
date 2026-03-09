import Transactions from "../../models/stock/transactions.js";

// logic for getting all transactions from database
export const fetch = async (req, res) => {
  try {
    const transactions = await Transactions.find();
    res.status(200).json({
      success: true,
      code: 200,
      data: transactions,
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

// logic for creating new transaction from database
export const create = async (req, res) => {
  try {
    const transactionData = new Transactions(req.body);
    const savedTransaction = await transactionData.save();
    res.status(200).json({
      success: true,
      code: 200,
      data: savedTransaction,
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

// logic for update a transaction
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    const transactionExist = await Transactions.findOne({ _id: id });
    if (!transactionExist) {
      return res
        .status(404)
        .json({ success: true, code: 404, message: "Transaction not found" });
    }
    const updatedTransaction = await Transactions.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
      }
    );
    res.status(200).json({
      success: true,
      code: 200,
      data: updatedTransaction,
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

// logic for delete a transaction from database
export const deleteTransaction = async (req, res) => {
  try {
    const id = req.params.id;
    const transactionExist = await Transactions.findOne({ _id: id });
    if (!transactionExist) {
      return res
        .status(404)
        .json({ success: true, code: 404, message: "Transaction not found" });
    }

    await Transactions.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      code: 200,
      message: "Transaction Successfully Deleted",
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
