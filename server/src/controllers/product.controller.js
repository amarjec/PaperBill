import Product from "../models/Product.js";

const getOwnerId = (user) => (user.role === "Owner" ? user.userId : user.ownerId);

export const createProduct = async (req, res) => {
  try {
    const { body, user } = req;
    const {
      item_name, unit, purchase_price, retail_price, wholesale_price,
      subcategory_id, alternate_brands, default_brand_name,
    } = body;

    if (!item_name || purchase_price === undefined) {
      return res.status(400).json({ success: false, message: "Item name and purchase price are required." });
    }

    const product = await Product.create({
      owner_id: getOwnerId(user),
      created_by: user.name,
      item_name,
      unit,
      purchase_price,
      retail_price,
      wholesale_price,
      subcategory_id,
      alternate_brands,
      default_brand_name,
    });
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ owner_id: getOwnerId(req.user), is_deleted: false });
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { params, user } = req;
    const product = await Product.findOne({ _id: params.id, owner_id: getOwnerId(user), is_deleted: false });

    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProductsBySubcategory = async (req, res) => {
  try {
    const { params, user } = req;
    const products = await Product.find({
      owner_id: getOwnerId(user),
      subcategory_id: params.subcategoryId,
      is_deleted: false,
    });
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { body, params, user } = req;
    const {
      item_name, unit, purchase_price, retail_price, wholesale_price,
      subcategory_id, alternate_brands, default_brand_name,
    } = body;

    const product = await Product.findOneAndUpdate(
      { _id: params.id, owner_id: getOwnerId(user), is_deleted: false },
      {
        item_name, unit, purchase_price, retail_price, wholesale_price,
        subcategory_id, alternate_brands, default_brand_name, updated_by: user.name,
      },
      { new: true },
    );

    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const softDeleteProduct = async (req, res) => {
  try {
    const { params, user } = req;
    const product = await Product.findOneAndUpdate(
      { _id: params.id, owner_id: getOwnerId(user), is_deleted: false },
      { is_deleted: true, deleted_by: user.name, deleted_at: new Date() },
    );

    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    res.status(200).json({ success: true, message: "Product deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};