import Category from "../models/Category.js";

const getOwnerId = (user) => (user.role === "Owner" ? user.userId : user.ownerId);

export const createCategory = async (req, res) => {
  try {
    const { body, user } = req;
    const { name, description } = body;
    
    if (!name) return res.status(400).json({ success: false, message: "Category name is required." });

    const category = await Category.create({
      owner_id: getOwnerId(user),
      name,
      description,
      created_by: user.name,
    });
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      owner_id: getOwnerId(req.user),
      is_deleted: false,
    });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { params, user } = req;
    const category = await Category.findOne({
      _id: params.id,
      owner_id: getOwnerId(user),
      is_deleted: false,
    });

    if (!category) return res.status(404).json({ success: false, message: "Category not found." });
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { body, params, user } = req;
    const { name, description } = body;
    
    if (!name) return res.status(400).json({ success: false, message: "Category name is required." });

    const category = await Category.findOneAndUpdate(
      { _id: params.id, owner_id: getOwnerId(user), is_deleted: false },
      { name, description },
      { new: true },
    );

    if (!category) return res.status(404).json({ success: false, message: "Category not found." });
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const softDeleteCategory = async (req, res) => {
  try {
    const { params, user } = req;
    const category = await Category.findOneAndUpdate(
      { _id: params.id, owner_id: getOwnerId(user), is_deleted: false },
      { is_deleted: true, deleted_by: user.name, deleted_at: new Date() },
    );

    if (!category) return res.status(404).json({ success: false, message: "Category not found." });
    res.status(200).json({ success: true, message: "Category deleted." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};