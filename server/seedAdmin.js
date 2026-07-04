// Seed / reset the primary admin account.
// Usage: node seedAdmin.js
// Reads MONGO_URI from .env. Creates admin@gmail.com as an approved superAdmin,
// or resets its password if it already exists.
import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Admin from "./models/Admin.js";

const EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@gmail.com";
const PASSWORD = process.env.SEED_ADMIN_PASSWORD || "admin0155@";
const NAME = process.env.SEED_ADMIN_NAME || "Administrator";

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to", process.env.MONGO_URI);

    const hashedPassword = await bcrypt.hash(PASSWORD, 10);
    const existing = await Admin.findOne({ email: EMAIL });

    if (existing) {
      existing.password = hashedPassword;
      existing.role = "superAdmin";
      existing.status = "approved";
      existing.name = existing.name || NAME;
      await existing.save();
      console.log(`♻️  Updated existing admin: ${EMAIL} (superAdmin / approved, password reset)`);
    } else {
      await Admin.create({
        name: NAME,
        email: EMAIL,
        password: hashedPassword,
        role: "superAdmin",
        status: "approved",
      });
      console.log(`✨ Created admin: ${EMAIL} (superAdmin / approved)`);
    }

    console.log("\n   Login with:");
    console.log(`   Email:    ${EMAIL}`);
    console.log(`   Password: ${PASSWORD}\n`);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
