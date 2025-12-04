import DocumentTemplate from "../../models/DocumentTemplate.js";
import cloudinary from "../../config/cloudinary.js";

// Helper function for error responses
const errorResponse = (res, status, message, error = null) => {
  return res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? error?.message : undefined,
  });
};

// Helper function to upload logo to Cloudinary
const uploadToCloudinary = async (logoBase64, adminId) => {
  try {
    if (!logoBase64 || typeof logoBase64 !== "string") {
      console.error("Invalid logo base64 data");
      return null;
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(logoBase64, {
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "crm_documents",
      public_id: `logo_${adminId}_${Date.now()}`,
      overwrite: false,
      resource_type: "image",
      transformation: [
        { width: 400, height: 200, crop: "limit" }, // Resize for optimization
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

// Helper function to delete logo from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted Cloudinary image: ${publicId}`);
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
  }
};

// Get active template for admin
export const getActiveTemplate = async (req, res) => {
  try {
    // First try to get the active default template
    let template = await DocumentTemplate.findOne({
      admin: req.admin._id,
      active: true,
      isDefault: true,
    });

    // If no default active template, get any active template
    if (!template) {
      template = await DocumentTemplate.findOne({
        admin: req.admin._id,
        active: true,
      }).sort({ updatedAt: -1 });
    }

    // If no template exists at all, return null instead of creating one
    if (!template) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No template found. Please create one.",
      });
    }

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Error fetching active template:", error);
    errorResponse(res, 500, "Server error while fetching template", error);
  }
};

// Get all templates for admin
export const getTemplates = async (req, res) => {
  try {
    const templates = await DocumentTemplate.find({
      admin: req.admin._id,
    }).sort({ isDefault: -1, updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    errorResponse(res, 500, "Server error while fetching templates", error);
  }
};

// Get single template by ID
export const getTemplateById = async (req, res) => {
  try {
    const template = await DocumentTemplate.findOne({
      _id: req.params.id,
      admin: req.admin._id,
    });

    if (!template) {
      return errorResponse(res, 404, "Template not found");
    }

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Error fetching template by ID:", error);
    errorResponse(res, 500, "Server error while fetching template", error);
  }
};

// Create new template
export const createTemplate = async (req, res) => {
  try {
    // Prepare template data
    let templateData = { ...req.body, admin: req.admin._id };
    const logoBase64 = templateData.logoBase64;

    // Delete logoBase64 from template data before saving to database
    delete templateData.logoBase64;

    // Convert string boolean values to actual booleans
    const booleanFields = [
      "watermarkEnabled",
      "showPageNumbers",
      "showCompanyInfoInFooter",
      "active",
      "isDefault",
    ];

    booleanFields.forEach((field) => {
      if (templateData[field] !== undefined) {
        // Convert to boolean - handles "true", "false", 1, 0, etc.
        templateData[field] = Boolean(templateData[field]);
      }
    });

    // Convert numeric fields
    const numericFields = [
      "watermarkOpacity",
      "fontSizeBase",
      "headerHeight",
      "footerHeight",
    ];

    numericFields.forEach((field) => {
      if (templateData[field] !== undefined) {
        templateData[field] = Number(templateData[field]);
      }
    });

    // Handle logo upload to Cloudinary
    if (logoBase64) {
      const uploadResult = await uploadToCloudinary(logoBase64, req.admin._id);
      if (uploadResult) {
        templateData.logoUrl = uploadResult.url;
        templateData.logoPublicId = uploadResult.publicId;
      }
    }

    const template = new DocumentTemplate(templateData);
    await template.save();

    res.status(201).json({
      success: true,
      message: "Template created successfully",
      data: template,
    });
  } catch (error) {
    console.error("Error creating template:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    errorResponse(res, 500, "Server error while creating template", error);
  }
};

// Update existing template
export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    let templateData = { ...req.body };
    const logoBase64 = templateData.logoBase64;

    // Delete logoBase64 from template data before saving to database
    delete templateData.logoBase64;

    // Convert string boolean values to actual booleans
    const booleanFields = [
      "watermarkEnabled",
      "showPageNumbers",
      "showCompanyInfoInFooter",
      "active",
      "isDefault",
    ];

    booleanFields.forEach((field) => {
      if (templateData[field] !== undefined) {
        // Convert to boolean - handles "true", "false", 1, 0, etc.
        templateData[field] = Boolean(templateData[field]);
      }
    });

    // Convert numeric fields
    const numericFields = [
      "watermarkOpacity",
      "fontSizeBase",
      "headerHeight",
      "footerHeight",
    ];

    numericFields.forEach((field) => {
      if (templateData[field] !== undefined) {
        templateData[field] = Number(templateData[field]);
      }
    });

    // Find existing template first
    const existingTemplate = await DocumentTemplate.findOne({
      _id: id,
      admin: req.admin._id,
    });

    if (!existingTemplate) {
      return errorResponse(res, 404, "Template not found");
    }

    // Handle logo upload to Cloudinary
    if (logoBase64) {
      const uploadResult = await uploadToCloudinary(logoBase64, req.admin._id);
      if (uploadResult) {
        templateData.logoUrl = uploadResult.url;
        templateData.logoPublicId = uploadResult.publicId;

        // Delete old logo from Cloudinary if exists
        if (existingTemplate.logoPublicId) {
          await deleteFromCloudinary(existingTemplate.logoPublicId);
        }
      }
    }

    const template = await DocumentTemplate.findOneAndUpdate(
      { _id: id, admin: req.admin._id },
      templateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Template updated successfully",
      data: template,
    });
  } catch (error) {
    console.error("Error updating template:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    errorResponse(res, 500, "Server error while updating template", error);
  }
};

// Delete template
export const deleteTemplate = async (req, res) => {
  try {
    const template = await DocumentTemplate.findOneAndDelete({
      _id: req.params.id,
      admin: req.admin._id,
    });

    if (!template) {
      return errorResponse(res, 404, "Template not found");
    }

    // Delete logo from Cloudinary if exists
    if (template.logoPublicId) {
      await deleteFromCloudinary(template.logoPublicId);
    }

    res.status(200).json({
      success: true,
      message: "Template deleted successfully",
      data: {
        id: template._id,
        templateName: template.templateName,
      },
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    errorResponse(res, 500, "Server error while deleting template", error);
  }
};

// Set template as default
export const setDefaultTemplate = async (req, res) => {
  try {
    const template = await DocumentTemplate.findOne({
      _id: req.params.id,
      admin: req.admin._id,
    });

    if (!template) {
      return errorResponse(res, 404, "Template not found");
    }

    // Set all other templates to not default
    await DocumentTemplate.updateMany(
      { admin: req.admin._id, _id: { $ne: template._id } },
      { $set: { isDefault: false } }
    );

    // Set this template as default
    template.isDefault = true;
    await template.save();

    res.status(200).json({
      success: true,
      message: "Template set as default successfully",
      data: template,
    });
  } catch (error) {
    console.error("Error setting default template:", error);
    errorResponse(
      res,
      500,
      "Server error while setting default template",
      error
    );
  }
};
