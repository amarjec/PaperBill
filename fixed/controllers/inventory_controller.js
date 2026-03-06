import PreInventoryItem from "../models/PreInventoryItem.js";
import Category from "../models/Category.js";
import Subcategory from "../models/Subcategory.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

export const importPreInventory = async (req, res) => {
  try {
    const { body, user } = req;
    const owner_id = user.userId;
    const { business_types } = body;

    if (!business_types || !Array.isArray(business_types) || business_types.length === 0) {
      return res.status(400).json({ success: false, message: "Valid business_types array is required." });
    }

    const created_by = "System Import";
    const templates  = await PreInventoryItem.find({ business_type: { $in: business_types } });

    if (templates.length === 0) {
      return res.status(404).json({ success: false, message: "No templates found for these types." });
    }

    const categoryMap    = new Map();
    const subcategoryMap = new Map();
    const productsToInsert = [];

    for (const item of templates) {
      let categoryId = categoryMap.get(item.category_name);
      if (!categoryId) {
        let existingCat = await Category.findOne({ owner_id, name: item.category_name });
        if (!existingCat) {
          existingCat = await Category.create({ owner_id, name: item.category_name, created_by });
        }
        categoryId = existingCat._id;
        categoryMap.set(item.category_name, categoryId);
      }

      let subcategoryId = null;
      if (item.subcategory_name) {
        const subMapKey = `${categoryId.toString()}-${item.subcategory_name}`;
        subcategoryId   = subcategoryMap.get(subMapKey);

        if (!subcategoryId) {
          let existingSub = await Subcategory.findOne({
            owner_id, category_id: categoryId, name: item.subcategory_name,
          });
          if (!existingSub) {
            existingSub = await Subcategory.create({
              owner_id, category_id: categoryId, name: item.subcategory_name, created_by,
            });
          }
          subcategoryId = existingSub._id;
          subcategoryMap.set(subMapKey, subcategoryId);
        }
      }

      // FIX: Check for an existing product with the same name under the same owner
      // before queuing it for insert to prevent duplicate products on repeated calls
      const existingProduct = await Product.findOne({
        owner_id,
        item_name:      item.item_name,
        subcategory_id: subcategoryId,
        is_deleted:     false,
      });
      if (existingProduct) continue;

      productsToInsert.push({
        owner_id,
        subcategory_id:    subcategoryId,
        item_name:         item.item_name,
        unit:              item.unit,
        default_brand_name: item.default_brands?.length > 0 ? item.default_brands[0] : "Generic",
        purchase_price:    0,
        retail_price:      0,
        wholesale_price:   0,
        created_by,
      });
    }

    if (productsToInsert.length > 0) {
      // ordered:false → continue on duplicate key errors (race condition safety net)
      await Product.insertMany(productsToInsert, { ordered: false });
    }

    res.status(200).json({ success: true, message: `Imported ${productsToInsert.length} items.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPreInventoryTemplates = async (req, res) => {
  try {
    const { query }      = req;
    const { businessType } = query;
    const dbQuery        = businessType ? { business_type: { $in: businessType.split(",") } } : {};

    const templates = await PreInventoryItem.find(dbQuery);
    res.status(200).json({ success: true, count: templates.length, templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const importInventoryTemplate = async (req, res) => {
  try {
    const { body, user } = req;

    if (!user?.userId) {
      return res.status(401).json({ success: false, message: "Authentication failed." });
    }

    const owner_id      = user.userId;
    const creator_name  = user.name || "System Import";
    const { templateData } = body;

    if (!templateData || !Array.isArray(templateData)) {
      return res.status(400).json({ success: false, message: "Invalid template format." });
    }

    for (const cat of templateData) {
      let existingCategory = await Category.findOne({ name: cat.category, owner_id, is_deleted: false });
      if (!existingCategory) {
        existingCategory = await Category.create({ name: cat.category, owner_id, created_by: creator_name });
      }

      for (const sub of cat.subCategories) {
        let existingSub = await Subcategory.findOne({
          name: sub.name, category_id: existingCategory._id, owner_id, is_deleted: false,
        });
        if (!existingSub) {
          existingSub = await Subcategory.create({
            name: sub.name, category_id: existingCategory._id, owner_id, created_by: creator_name,
          });
        }

        const productsToInsert = sub.products.map((prod) => ({
          owner_id,
          subcategory_id:    existingSub._id,
          item_name:         prod.label,
          unit:              prod.unit || "pcs",
          purchase_price:    Number(prod.costPrice)      || 0,
          retail_price:      Number(prod.sellingPrice)   || 0,
          wholesale_price:   Number(prod.wholesalePrice) || 0,
          default_brand_name: "Generic",
          created_by:        creator_name,
          alternate_brands:  [],
          is_deleted:        false,
        }));

        if (productsToInsert.length > 0) {
          try {
            await Product.insertMany(productsToInsert, { ordered: false });
          } catch {
            // Suppress duplicate key errors — idempotent import
          }
        }
      }
    }

    await User.findByIdAndUpdate(owner_id, { has_inventory: true });
    res.status(200).json({ success: true, message: "Inventory successfully pre-filled!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};
