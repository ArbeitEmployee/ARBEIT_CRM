import mongoose from "mongoose";

const documentTemplateSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    templateName: {
      type: String,
      required: true,
      default: "Default Template",
    },
    documentTypes: [
      {
        type: String,
        enum: [
          "Proposal",
          "Invoice",
          "Expense",
          "Quote",
          "Receipt",
          "Estimate",
          "Contract",
        ],
        default: ["Proposal", "Invoice", "Expense"],
      },
    ],
    companyName: String,
    companyEmail: String,
    companyPhone: String,
    companyAddress: String,
    companyWebsite: String,
    taxId: String,
    bankDetails: String,
    logoUrl: String, // Now stores Cloudinary URL
    logoPublicId: String, // Store Cloudinary public_id for deletion/updates
    watermarkEnabled: {
      type: Boolean,
      default: true,
    },
    watermarkOpacity: {
      type: Number,
      default: 0.1,
      min: 0,
      max: 1,
    },
    primaryColor: {
      type: String,
      default: "#333333",
    },
    secondaryColor: {
      type: String,
      default: "#666666",
    },
    fontFamily: {
      type: String,
      default: "Arial",
    },
    fontSizeBase: {
      type: Number,
      default: 10,
      min: 8,
      max: 14,
    },
    headerHeight: {
      type: Number,
      default: 50,
    },
    footerHeight: {
      type: Number,
      default: 30,
    },
    footerText: {
      type: String,
      default: "Thank you for your business!",
    },
    showPageNumbers: {
      type: Boolean,
      default: true,
    },
    showCompanyInfoInFooter: {
      type: Boolean,
      default: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Ensure only one default template per admin
documentTemplateSchema.pre("save", async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { admin: this.admin, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Index for quick active template retrieval
documentTemplateSchema.index({ admin: 1, active: 1 });
documentTemplateSchema.index({ admin: 1, isDefault: 1 });

const DocumentTemplate = mongoose.model(
  "DocumentTemplate",
  documentTemplateSchema
);
export default DocumentTemplate;
