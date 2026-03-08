import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Staff from "../models/Staff.js";

// ── Helper: derive live premium status from subscription dates ────────────────
// Never trust the stored `isPremium` boolean alone — always cross-check
// against `subscription.end_date`. If the subscription has lapsed, we flip
// `isPremium` back to false in the DB (lazy expiry) so it stays consistent.
const resolvePremiumStatus = async (user) => {
  const sub = user.subscription;

  // No subscription data at all → definitely free
  if (!sub || !sub.end_date) {
    if (user.isPremium) {
      // Stored flag was true but there's no end_date — corrupted state, fix it
      await User.findByIdAndUpdate(user._id, {
        isPremium: false,
        "subscription.status": "inactive",
      });
    }
    return false;
  }

  const now = new Date();
  const expired = new Date(sub.end_date) <= now;

  if (expired) {
    // Subscription has lapsed — lazily flip the flag in DB if it hasn't been already
    if (user.isPremium || sub.status === "active") {
      await User.findByIdAndUpdate(user._id, {
        isPremium: false,
        "subscription.status": "expired",
      });
    }
    return false;
  }

  // Subscription is still valid — ensure the flag is correctly set
  if (!user.isPremium) {
    await User.findByIdAndUpdate(user._id, {
      isPremium: true,
      "subscription.status": "active",
    });
  }
  return true;
};

export const protect = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    let token;

    if (authorization?.startsWith("Bearer ")) {
      token = authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, no token" });
    }

    // 1. Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId, role, deviceId } = decoded;

    // 2. Fetch User or Staff
    let currentUser;
    let ownerPremiumStatus = false;

    if (role === "Owner") {
      // Fetch subscription fields too so resolvePremiumStatus can evaluate them
      currentUser = await User.findById(userId).select(
        "name device_id isPremium permissions subscription",
      );

      if (currentUser) {
        ownerPremiumStatus = await resolvePremiumStatus(currentUser);
      }
    } else if (role === "Staff") {
      currentUser = await Staff.findById(userId).select(
        "name device_id permissions owner_id status is_deleted",
      );

      if (currentUser) {
        if (currentUser.status === "Suspended" || currentUser.is_deleted) {
          return res.status(403).json({
            success: false,
            message: "Account suspended or deleted. Contact the owner.",
          });
        }

        // Fetch owner with subscription so we can resolve their live status
        const owner = await User.findById(currentUser.owner_id).select(
          "isPremium subscription",
        );

        if (owner) {
          ownerPremiumStatus = await resolvePremiumStatus(owner);
        }
      }
    }

    if (!currentUser) {
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists" });
    }

    // 3. Single-Device Policy
    if (currentUser.device_id !== deviceId) {
      return res.status(401).json({
        success: false,
        message: "LOGOUT_REQUIRED",
        reason: "Account accessed from another device.",
      });
    }

    // 4. Attach to request
    req.user = {
      userId: currentUser._id,
      ownerId: role === "Owner" ? currentUser._id : currentUser.owner_id,
      role,
      name: currentUser.name,
      permissions: currentUser.permissions || null,
      isPremium: ownerPremiumStatus, // ← always live-derived, never stale
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({
          success: false,
          message: "Token expired, please log in again.",
        });
    }
    res
      .status(401)
      .json({ success: false, message: "Not authorized, token failed" });
  }
};
