import Subcategory from "../models/Subcategory.js";

const getOwnerId = (user) => (user.role === "Owner" ? user.userId : user.ownerId);

export const createSubcategory = async (req, res) => {
  try {
    const { body, user } = req;
    const { category_id, name, description } = body;
    
    if (!category_id || !name) {
      return res.status(400).json({ success: false, message: "Category ID and subcategory name are required." });
    }

    const subcategory = await Subcategory.create({
      owner_id: getOwnerId(user),
      category_id,
      name,
      description,
      created_by: user.name,
    });
    res.status(201).json({ success: true, subcategory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllSubcategories = async (req, res) => {
  try {
    const subcategories = await Subcategory.find({ owner_id: getOwnerId(req.user), is_deleted: false });
    res.status(200).json({ success: true, subcategories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSubcategoryById = async (req, res) => {
  try {
    const { params, user } = req;
    const subcategory = await Subcategory.findOne({ _id: params.id, owner_id: getOwnerId(user), is_deleted: false })
      .populate("category_id", "name");

    if (!subcategory) return res.status(404).json({ success: false, message: "Subcategory not found." });
    res.status(200).json({ success: true, subcategory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateSubcategory = async (req, res) => {
  try {
    const { body, params, user } = req;
    const { name, category_id, description } = body;
    
    if (!name || !category_id) {
      return res.status(400).json({ success: false, message: "Name and Category ID are required." });
    }

    const subcategory = await Subcategory.findOneAndUpdate(
      { _id: params.id, owner_id: getOwnerId(user), is_deleted: false },
      { name, category_id, description },
      { new: true },
    );

    if (!subcategory) return res.status(404).json({ success: false, message: "Subcategory not found." });
    res.status(200).json({ success: true, subcategory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const softDeleteSubcategory = async (req, res) => {
  try {
    const { params, user } = req;
    const subcategory = await Subcategory.findOneAndUpdate(
      { _id: params.id, owner_id: getOwnerId(user), is_deleted: false },
      { is_deleted: true, deleted_by: user.name, deleted_at: new Date() },
    );

    if (!subcategory) return res.status(404).json({ success: false, message: "Subcategory not found." });
    res.status(200).json({ success: true, message: "Subcategory deleted." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};