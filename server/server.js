import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import adminAuthRoutes from "./routes/admin/authRoutes.js";
import clientAuthRoutes from "./routes/client/authRoutes.js";
import customerRoutes from "./routes/admin/customerRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/admin", adminAuthRoutes);
app.use("/api/client", clientAuthRoutes);
app.use("/api/customers", customerRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));