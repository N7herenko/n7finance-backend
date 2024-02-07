import Categories from "../../models/crypto/categories.js";

// logic for getting all categories from database
export const fetch = async (req, res) => {
  try {
    const categories = await Categories.find();
    if (categories.length === 0) {
      return res
        .status(404)
        .json({ success: true, code: 404, message: "Categories not found" });
    }
    res.status(200).json({
      success: true,
      code: 200,
      data: categories,
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

// logic for creating new category from database
export const create = async (req, res) => {
  try {
    const categoryData = new Categories(req.body);
    const { name } = categoryData;
    const nameExist = await Categories.findOne({ name });
    if (nameExist) {
      return res
        .status(400)
        .json({ success: true, code: 404, message: "Category already exist" });
    }
    const savedCategory = await categoryData.save();
    res.status(200).json({
      success: true,
      code: 200,
      data: savedCategory,
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

// logic for update a category
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    const categoryExist = await Categories.findOne({ _id: id });
    if (!categoryExist) {
      return res
        .status(404)
        .json({ success: true, code: 404, message: "Category not found" });
    }
    const updatedCategory = await Categories.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(200).json({
      success: true,
      code: 200,
      data: updatedCategory,
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

// logic for delete a category from database
export const deleteCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const categoryExist = await Categories.findOne({ _id: id });
    if (!categoryExist) {
      return res
        .status(404)
        .json({ success: true, code: 404, message: "Category not found" });
    }

    await Categories.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      code: 200,
      message: "Category Successfully Deleted",
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
