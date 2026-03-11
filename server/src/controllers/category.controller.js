import Category from "../models/Category.js";
import Subcategory from "../models/Subcategory.js";
import Product from "../models/Product.js";

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

// ── Cascade soft-delete: category → its subcategories → their products ─────────
export const softDeleteCategory = async (req, res) => {
  try {
    const { params, user } = req;
    const owner_id = getOwnerId(user);
    const now = new Date();
    const deletedBy = user.name;

    // 1. Soft-delete the category itself
    const category = await Category.findOneAndUpdate(
      { _id: params.id, owner_id, is_deleted: false },
      { is_deleted: true, deleted_by: deletedBy, deleted_at: now },
    );

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    // 2. Find all non-deleted subcategories under this category
    const subcategories = await Subcategory.find({
      owner_id,
      category_id: category._id,
      is_deleted: false,
    }).select('_id');

    const subcategoryIds = subcategories.map(s => s._id);

    // Run subcategory soft-delete and product cascade in parallel
    await Promise.all([
      // 3a. Cascade: soft-delete all those subcategories
      Subcategory.updateMany(
        { _id: { $in: subcategoryIds }, owner_id },
        {
          is_deleted: true,
          deleted_by: `[Category deleted by ${deletedBy}]`,
          deleted_at: now,
        },
      ),
      // 3b. Cascade: soft-delete all products belonging to any of those subcategories
      //     Also catches products directly referencing this category's subcategories
      subcategoryIds.length > 0
        ? Product.updateMany(
            { owner_id, subcategory_id: { $in: subcategoryIds }, is_deleted: false },
            {
              is_deleted: true,
              deleted_by: `[Category deleted by ${deletedBy}]`,
              deleted_at: now,
            },
          )
        : Promise.resolve(),
    ]);

    res.status(200).json({
      success: true,
      message: "Category, its sub-categories, and their products deleted.",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};