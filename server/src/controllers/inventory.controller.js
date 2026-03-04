import PreInventoryItem from '../models/PreInventoryItem.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import Product from '../models/Product.js';
import User from '../models/User.js'; 

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


export const importInventoryTemplate = async (req, res) => {
    try {
        const { templateData } = req.body;
        
        // Ensure user is attached by protect middleware
        if (!req.user || !req.user.ownerId) {
            return res.status(401).json({ success: false, message: "Authentication failed" });
        }

        const owner_id = req.user.ownerId; 
        const creator_name = req.user.name || "System Import"; 

        if (!templateData || !Array.isArray(templateData)) {
            return res.status(400).json({ success: false, message: "Invalid template format" });
        }

        console.log(`🚀 Starting Bulk Import for Shop: ${owner_id}`);

        // Loop through each category in the selected template
        for (const cat of templateData) {
            // Find or Create Category
            let existingCategory = await Category.findOne({ name: cat.category, owner_id, is_deleted: false });
            
            if (!existingCategory) {
                existingCategory = await Category.create({ 
                    name: cat.category, 
                    owner_id, 
                    created_by: creator_name 
                });
            }

            for (const sub of cat.subCategories) {
                // Find or Create SubCategory
                let existingSub = await Subcategory.findOne({ 
                    name: sub.name, 
                    category_id: existingCategory._id, 
                    owner_id,
                    is_deleted: false 
                });
                
                if (!existingSub) {
                    existingSub = await Subcategory.create({
                        name: sub.name,
                        category_id: existingCategory._id,
                        owner_id,
                        created_by: creator_name
                    });
                }

                // Map items to match your Product schema
                const productsToInsert = sub.products.map(prod => ({
                    owner_id: owner_id, //
                    subcategory_id: existingSub._id, //
                    item_name: prod.label, //
                    unit: prod.unit || 'pcs', //
                    purchase_price: Number(prod.costPrice) || 0, //
                    retail_price: Number(prod.sellingPrice) || 0, //
                    wholesale_price: Number(prod.wholesalePrice) || 0, //
                    default_brand_name: 'Generic', 
                    created_by: creator_name, //
                    alternate_brands: [],
                    is_deleted: false
                }));

                if (productsToInsert.length > 0) {
                    try {
                        // Bulk insert, skipping duplicates
                        await Product.insertMany(productsToInsert, { ordered: false });
                    } catch (bulkErr) {
                        console.log(`Note: Some items in ${sub.name} already exist.`);
                    }
                }
            }
        }

        await User.findByIdAndUpdate(owner_id, { has_inventory: true });

        res.status(200).json({ success: true, message: "Inventory successfully pre-filled!" });

    } catch (error) {
        console.error("❌ BULK IMPORT CRASHED:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error during import", 
            error: error.message 
        });
    }
};