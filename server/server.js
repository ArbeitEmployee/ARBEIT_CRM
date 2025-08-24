import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import adminAuthRoutes from "./routes/admin/authRoutes.js";
import clientAuthRoutes from "./routes/client/authRoutes.js";
import customerRoutes from "./routes/admin/customerRoutes.js";
import itemRoutes from "./routes/admin/itemRoutes.js";
import proposalRoutes from "./routes/admin/proposalRoutes.js";
import estimateRoutes from "./routes/admin/estimateRoutes.js";
import subscriptionRoutes from "./routes/admin/subscriptionRoutes.js";

dotenv.config();

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/admin", adminAuthRoutes);
app.use("/api/client", clientAuthRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/admin", itemRoutes);
app.use("/api/admin", proposalRoutes);
app.use("/api/admin", estimateRoutes);
app.use("/api/subscriptions", subscriptionRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));