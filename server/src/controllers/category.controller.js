import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';

// --- CATEGORY ---
export const createCategory = async (req, res) => {
  try {
    const category = await Category.create({
      owner_id: req.user.ownerId,
      name: req.body.name,
      created_by: req.user.name
    });
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ owner_id: req.user.ownerId, is_deleted: false });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, owner_id: req.user.ownerId },
      { name: req.body.name },
      { new: true }
    );
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const softDeleteCategory = async (req, res) => {
  try {
    await Category.findOneAndUpdate(
      { _id: req.params.id, owner_id: req.user.ownerId },
      { is_deleted: true }
    );
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// Get a single category by ID
export const getCategoryById = async (req, res) => {
  try {
    const owner_id = req.user.role === 'Owner' ? req.user.userId : req.user.ownerId;
    
    const category = await Category.findOne({ _id: req.params.id, owner_id, is_deleted: false });
    
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};



// --- SUBCATEGORY ---
export const createSubcategory = async (req, res) => {
  try {
    const { category_id, name } = req.body;
    const subcategory = await Subcategory.create({
      owner_id: req.user.ownerId,
      category_id,
      name,
      created_by: req.user.name
    });
    res.status(201).json({ success: true, subcategory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllSubcategories = async (req, res) => {
  try {
    const subcategories = await Subcategory.find({ owner_id: req.user.ownerId, is_deleted: false });
    res.status(200).json({ success: true, subcategories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findOneAndUpdate(
      { _id: req.params.id, owner_id: req.user.ownerId },
      { name: req.body.name, category_id: req.body.category_id },
      { new: true }
    );
    res.status(200).json({ success: true, subcategory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const softDeleteSubcategory = async (req, res) => {
  try {
    await Subcategory.findOneAndUpdate(
      { _id: req.params.id, owner_id: req.user.ownerId },
      { is_deleted: true }
    );
    res.status(200).json({ success: true, message: 'Subcategory deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a single subcategory by ID
export const getSubcategoryById = async (req, res) => {
  try {
    const owner_id = req.user.role === 'Owner' ? req.user.userId : req.user.ownerId;
    
    const subcategory = await Subcategory.findOne({ _id: req.params.id, owner_id, is_deleted: false })
      .populate('category_id', 'name'); // Populates the parent category name
      
    if (!subcategory) return res.status(404).json({ success: false, message: 'Subcategory not found' });
    
    res.status(200).json({ success: true, subcategory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};