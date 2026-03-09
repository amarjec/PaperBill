import bcrypt from "bcryptjs";
import Staff from "../models/Staff.js";

export const addStaff = async (req, res) => {
  try {
    const { body, user } = req;
    const { name, phone_number, assigned_pin, permissions } = body;
    const owner_id = user.userId;

    if (!name || !phone_number || phone_number.length !== 10) {
      return res.status(400).json({ success: false, message: "Name and phone number are required." });
    }

    if (!assigned_pin) {
      return res.status(400).json({ success: false, message: "assigned_pin is required." });
    }

    const staffExists = await Staff.findOne({ owner_id, phone_number, is_deleted: false });
    if (staffExists) {
      return res.status(400).json({ success: false, message: "Staff with this number already exists." });
    }

    const hashedPin = await bcrypt.hash(assigned_pin, 10);

    const staff = await Staff.create({
      owner_id, name, phone_number,
      assigned_pin: hashedPin,
      permissions,
    });

    res.status(201).json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStaffMembers = async (req, res) => {
  try {
    const { user } = req;
    const staff = await Staff.find({ owner_id: user.userId, is_deleted: false }).select("-assigned_pin");
    res.status(200).json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateStaffPermission = async (req, res) => {
  try {
    const { body, params, user } = req;
    const { permissions, status, assigned_pin, name, phone_number } = body;

    const updateFields = { permissions, status };

    if (name) updateFields.name = name;
    if (phone_number) updateFields.phone_number = phone_number;

    if (assigned_pin) {
      updateFields.assigned_pin = await bcrypt.hash(assigned_pin, 10);
    }

    const staff = await Staff.findOneAndUpdate(
      { _id: params.id, owner_id: user.userId, is_deleted: false },
      updateFields,
      { new: true },
    ).select("-assigned_pin");

    if (!staff) return res.status(404).json({ success: false, message: "Staff member not found." });
    res.status(200).json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const softDeleteStaff = async (req, res) => {
  try {
    const { params, user } = req;
    const staff = await Staff.findOneAndUpdate(
      { _id: params.id, owner_id: user.userId, is_deleted: false },
      { is_deleted: true, deleted_by: user.name, deleted_at: new Date(), device_id: null },
    );

    if (!staff) return res.status(404).json({ success: false, message: "Staff member not found." });
    res.status(200).json({ success: true, message: "Staff deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};