import PreInventoryItem from '../models/PreInventoryItem.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import Product from '../models/Product.js';

export const importPreInventory = async (req, res) => {
  try {
    const owner_id = req.user.userId;
    const { business_types } = req.body; // Array, e.g., ['Hardware', 'Electronics']
    const created_by = 'System Import';

    // 1. Fetch the templates
    const templates = await PreInventoryItem.find({ business_type: { $in: business_types } });
    if (templates.length === 0) {
      return res.status(404).json({ success: false, message: 'No templates found for these types.' });
    }

    // Dictionaries to prevent creating duplicate categories/subcategories during the loop
    const categoryMap = new Map(); // 'Hardware' -> Category ObjectId
    const subcategoryMap = new Map(); // 'Hardware-Pipes' -> Subcategory ObjectId

    const productsToInsert = [];

    // 2. Loop through templates and build the relational structure sequentially
    for (const item of templates) {
      
      // --- Handle Category ---
      let categoryId = categoryMap.get(item.category_name);
      if (!categoryId) {
        // Check if the user already has this category to avoid duplicates from previous imports
        let existingCat = await Category.findOne({ owner_id, name: item.category_name });
        if (!existingCat) {
          existingCat = await Category.create({ owner_id, name: item.category_name, created_by });
        }
        categoryId = existingCat._id;
        categoryMap.set(item.category_name, categoryId);
      }

      // --- Handle Subcategory ---
      let subcategoryId = null;
      if (item.subcategory_name) {
        // Unique key combines category + subcategory to prevent cross-category naming collisions
        const subMapKey = `${categoryId.toString()}-${item.subcategory_name}`;
        subcategoryId = subcategoryMap.get(subMapKey);
        
        if (!subcategoryId) {
          let existingSub = await Subcategory.findOne({ owner_id, category_id: categoryId, name: item.subcategory_name });
          if (!existingSub) {
            existingSub = await Subcategory.create({ 
              owner_id, 
              category_id: categoryId, 
              name: item.subcategory_name, 
              created_by 
            });
          }
          subcategoryId = existingSub._id;
          subcategoryMap.set(subMapKey, subcategoryId);
        }
      }

      // --- Prepare Product ---
      // We set prices to 0 so the Owner can fill them in later
      productsToInsert.push({
        owner_id,
        subcategory_id: subcategoryId, // Can be null if no subcategory exists
        item_name: item.item_name,
        unit: item.unit,
        default_brand_name: item.default_brands && item.default_brands.length > 0 ? item.default_brands[0] : 'Generic',
        purchase_price: 0,
        retail_price: 0,
        wholesale_price: 0,
        created_by
      });
    }

    // 3. Bulk Insert the Products (Much faster than saving 500 items one-by-one)
    if (productsToInsert.length > 0) {
      await Product.insertMany(productsToInsert);
    }

    res.status(200).json({ 
      success: true, 
      message: `Successfully imported ${productsToInsert.length} items, creating ${categoryMap.size} categories.` 
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPreInventoryTemplates = async (req, res) => {
  try {
    const { businessType } = req.query; // e.g., ?businessType=Hardware
    
    let query = {};
    if (businessType) {
      // If the user has multiple business types, query handles arrays automatically
      query.business_type = { $in: businessType.split(',') }; 
    }

    const templates = await PreInventoryItem.find(query);
    res.status(200).json({ success: true, count: templates.length, templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};