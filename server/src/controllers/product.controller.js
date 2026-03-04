import Product from '../models/Product.js';

export const createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      owner_id: req.user.role === 'Owner' ? req.user.userId : req.user.ownerId,
      created_by: req.user.name
    };
    const product = await Product.create(productData);
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ owner_id: req.user.role === 'Owner' ? req.user.userId : req.user.ownerId, is_deleted: false });
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const owner_id = req.user.role === 'Owner' ? req.user.userId : req.user.ownerId;
    const product = await Product.findOne({ _id: req.params.id, owner_id, is_deleted: false });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProductsBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    const products = await Product.find({ 
      owner_id: req.user.role === 'Owner' ? req.user.userId : req.user.ownerId,
      subcategory_id: subcategoryId, 
      is_deleted: false 
    });
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, owner_id: req.user.role === 'Owner' ? req.user.userId : req.user.ownerId,},
      { ...req.body, updated_by: req.user.name },
      { new: true }
    );
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const softDeleteProduct = async (req, res) => {
  try {
    await Product.findOneAndUpdate(
      { _id: req.params.id, owner_id: req.user.role === 'Owner' ? req.user.userId : req.user.ownerId },
      { 
        is_deleted: true, 
        deleted_by: req.user.name,
        deleted_at: new Date()
      }
    );
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
