import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import Bill from '../models/Bill.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import KhataTransaction from '../models/KhataTransaction.js';

const MODELS = { Customer, Product, Bill, Category, Subcategory };

const getOwnerId = (user) => user.userId; // owner-only route

const RESTORE_UPDATE = { is_deleted: false, $unset: { deleted_by: '', deleted_at: '' } };

// ── GET /api/recycle-bin ───────────────────────────────────────────────────────
export const getRecycleBin = async (req, res) => {
  try {
    const owner_id = getOwnerId(req.user);

    // Cascade-deleted items are excluded from the listing — they are managed
    // through their parent (restoring/deleting the parent handles them).
    const cascadeFilter = { $not: { $regex: /^\[(Category|Subcategory) deleted by/ } };

    const [customers, products, bills, categories, subcategories] = await Promise.all([
      Customer.find({ owner_id, is_deleted: true })
        .select('name phone deleted_by deleted_at').lean(),
      Product.find({ owner_id, is_deleted: true, deleted_by: cascadeFilter })
        .select('item_name unit subcategory_id deleted_by deleted_at').lean(),
      Bill.find({ owner_id, is_deleted: true })
        .select('bill_number total_amount status deleted_by deleted_at').lean(),
      Category.find({ owner_id, is_deleted: true })
        .select('name description deleted_by deleted_at').lean(),
      Subcategory.find({ owner_id, is_deleted: true, deleted_by: cascadeFilter })
        .select('name category_id deleted_by deleted_at').lean(),
    ]);

    const tag = (items, type, displayField) =>
      items.map(item => ({
        ...item,
        _type: type,
        _displayName: item[displayField] || 'Untitled',
      }));

    const all = [
      ...tag(customers,     'Customer',    'name'),
      ...tag(products,      'Product',     'item_name'),
      ...tag(bills,         'Bill',        'bill_number'),
      ...tag(categories,    'Category',    'name'),
      ...tag(subcategories, 'Subcategory', 'name'),
    ].sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));

    res.status(200).json({ success: true, items: all });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/recycle-bin/restore ─────────────────────────────────────────────
// Restores items with full cascade:
//   Restoring a Category   → also restores its Subcategories + their Products
//   Restoring a Subcategory → also restores its Products
//   Other types            → restores only that document
export const restoreItems = async (req, res) => {
  try {
    const owner_id = getOwnerId(req.user);
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided.' });
    }

    const ops = items.map(async ({ id, type }) => {
      if (type === 'Category') {
        // 1. Restore the category
        await Category.findOneAndUpdate({ _id: id, owner_id, is_deleted: true }, RESTORE_UPDATE);

        // 2. Find subcategories that were cascade-deleted WITH this category
        //    (identified by deleted_by containing the cascade marker)
        const subcats = await Subcategory.find({
          owner_id,
          category_id: id,
          is_deleted: true,
          deleted_by: { $regex: /^\[Category deleted by/ },
        }).select('_id');

        const subcatIds = subcats.map(s => s._id);

        await Promise.all([
          // 3. Restore those subcategories
          Subcategory.updateMany(
            { _id: { $in: subcatIds }, owner_id },
            RESTORE_UPDATE,
          ),
          // 4. Restore products that were cascade-deleted with the category
          Product.updateMany(
            {
              owner_id,
              subcategory_id: { $in: subcatIds },
              is_deleted: true,
              deleted_by: { $regex: /^\[Category deleted by/ },
            },
            RESTORE_UPDATE,
          ),
        ]);

      } else if (type === 'Subcategory') {
        // 1. Restore the subcategory
        await Subcategory.findOneAndUpdate({ _id: id, owner_id, is_deleted: true }, RESTORE_UPDATE);

        // 2. Restore products that were cascade-deleted WITH this subcategory
        await Product.updateMany(
          {
            owner_id,
            subcategory_id: id,
            is_deleted: true,
            deleted_by: { $regex: /^\[Subcategory deleted by/ },
          },
          RESTORE_UPDATE,
        );

      } else {
        // Customer, Product, Bill — restore as-is
        const Model = MODELS[type];
        if (Model) await Model.findOneAndUpdate({ _id: id, owner_id, is_deleted: true }, RESTORE_UPDATE);
      }
    });

    await Promise.all(ops);
    res.status(200).json({ success: true, message: `${items.length} item(s) restored.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE /api/recycle-bin/hard-delete ───────────────────────────────────────
// Permanently deletes selected items with cascade:
//   Hard-deleting a Category   → also hard-deletes its Subcategories + Products
//   Hard-deleting a Subcategory → also hard-deletes its Products
export const hardDeleteItems = async (req, res) => {
  try {
    const owner_id = getOwnerId(req.user);
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided.' });
    }

    const ops = items.map(async ({ id, type }) => {
      if (type === 'Category') {
        // Find cascade-deleted subcategories
        const subcats = await Subcategory.find({
          owner_id, category_id: id, is_deleted: true,
        }).select('_id');
        const subcatIds = subcats.map(s => s._id);

        await Promise.all([
          Category.findOneAndDelete({ _id: id, owner_id, is_deleted: true }),
          Subcategory.deleteMany({ _id: { $in: subcatIds }, owner_id }),
          subcatIds.length > 0
            ? Product.deleteMany({ owner_id, subcategory_id: { $in: subcatIds }, is_deleted: true })
            : Promise.resolve(),
        ]);

      } else if (type === 'Subcategory') {
        await Promise.all([
          Subcategory.findOneAndDelete({ _id: id, owner_id, is_deleted: true }),
          Product.deleteMany({ owner_id, subcategory_id: id, is_deleted: true }),
        ]);

      } else if (type === 'Customer') {
        // Hard-delete the customer + wipe all their khata transactions
        await Promise.all([
          Customer.findOneAndDelete({ _id: id, owner_id, is_deleted: true }),
          KhataTransaction.deleteMany({ owner_id, customer_id: id }),
        ]);

      } else {
        const Model = MODELS[type];
        if (Model) await Model.findOneAndDelete({ _id: id, owner_id, is_deleted: true });
      }
    });

    await Promise.all(ops);
    res.status(200).json({ success: true, message: `${items.length} item(s) permanently deleted.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE /api/recycle-bin/empty ─────────────────────────────────────────────
// Permanently deletes ALL soft-deleted documents for this owner.
// Customers: also wipes their KhataTransactions.
export const emptyRecycleBin = async (req, res) => {
  try {
    const owner_id = getOwnerId(req.user);

    // Collect IDs of all soft-deleted customers before wiping, so we can
    // cascade-delete their transactions in the same pass.
    const deletedCustomers = await Customer.find({ owner_id, is_deleted: true }).select('_id').lean();
    const customerIds = deletedCustomers.map(c => c._id);

    await Promise.all([
      ...Object.values(MODELS).map(Model => Model.deleteMany({ owner_id, is_deleted: true })),
      customerIds.length > 0
        ? KhataTransaction.deleteMany({ owner_id, customer_id: { $in: customerIds } })
        : Promise.resolve(),
    ]);

    res.status(200).json({ success: true, message: 'Recycle bin emptied.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};