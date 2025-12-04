/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import {
  FaSave,
  FaUndo,
  FaEye,
  FaUpload,
  FaPalette,
  FaPlus,
} from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DocumentTemplate = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");
  const [noTemplate, setNoTemplate] = useState(false);

  // Template state with proper boolean initialization
  const [template, setTemplate] = useState({
    _id: null,
    templateName: "Default Template",
    documentTypes: ["Proposal", "Invoice", "Expense", "Quote", "Receipt"],
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    companyWebsite: "",
    taxId: "",
    bankDetails: "",
    logoUrl: "",
    watermarkEnabled: true,
    watermarkOpacity: 0.1,
    primaryColor: "#333333",
    secondaryColor: "#666666",
    fontFamily: "Arial",
    fontSizeBase: 10,
    headerHeight: 50,
    footerHeight: 30,
    footerText: "Thank you for your business!",
    showPageNumbers: true,
    showCompanyInfoInFooter: true,
    active: true,
    isDefault: true,
  });

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem("crm_token");
  };

  // Create axios instance with auth headers
  const createAxiosConfig = () => {
    const token = getAuthToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Fetch existing template
  const fetchTemplate = async () => {
    setLoading(true);
    setNoTemplate(false);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/admin/document-templates/active`,
        config
      );

      if (data.success) {
        if (data.data) {
          // Ensure boolean fields are properly converted
          const templateData = {
            ...data.data,
            watermarkEnabled: Boolean(data.data.watermarkEnabled),
            showPageNumbers: Boolean(data.data.showPageNumbers),
            showCompanyInfoInFooter: Boolean(data.data.showCompanyInfoInFooter),
            active: Boolean(data.data.active),
            isDefault: Boolean(data.data.isDefault),
            // Ensure opacity is a number
            watermarkOpacity: Number(data.data.watermarkOpacity) || 0.1,
            // Ensure fontSizeBase is a number
            fontSizeBase: Number(data.data.fontSizeBase) || 10,
          };

          setTemplate(templateData);
          if (data.data.logoUrl) {
            setLogoPreview(data.data.logoUrl); // Cloudinary URL
          }
        } else {
          // No template exists
          setNoTemplate(true);
          console.log("No existing template found");
        }
      }
    } catch (err) {
      console.error("Error fetching template:", err);
      // Don't create template automatically on error
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplate();
  }, []);

  // Handle input changes - fixed for checkboxes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setTemplate({
        ...template,
        [name]: checked,
      });
    } else if (type === "number") {
      setTemplate({
        ...template,
        [name]: Number(value),
      });
    } else {
      setTemplate({
        ...template,
        [name]: value,
      });
    }
  };

  // Handle color changes
  const handleColorChange = (name, value) => {
    setTemplate({
      ...template,
      [name]: value,
    });
  };

  // Handle logo upload (base64)
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        alert("File size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setLogoPreview(base64String);
        // Store base64 string in template for upload
        setTemplate({
          ...template,
          logoBase64: base64String,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Create new template (first time)
  const handleCreateFirstTemplate = () => {
    setNoTemplate(false);
    // Keep the default values for new template
  };

  // Save template function
  const handleSave = async () => {
    setSaving(true);
    try {
      const config = createAxiosConfig();

      // Prepare template data - ensure all fields are properly formatted
      const templateData = {
        ...template,
        // Ensure boolean fields are properly sent
        watermarkEnabled: Boolean(template.watermarkEnabled),
        showPageNumbers: Boolean(template.showPageNumbers),
        showCompanyInfoInFooter: Boolean(template.showCompanyInfoInFooter),
        active: Boolean(template.active),
        isDefault: Boolean(template.isDefault),
        // Ensure numeric fields are properly sent
        watermarkOpacity: Number(template.watermarkOpacity),
        fontSizeBase: Number(template.fontSizeBase),
        headerHeight: Number(template.headerHeight),
        footerHeight: Number(template.footerHeight),
      };

      // Check if template has an _id (for update) or not (for create)
      const method = template._id ? "put" : "post";
      const url = template._id
        ? `${API_BASE_URL}/admin/document-templates/${template._id}`
        : `${API_BASE_URL}/admin/document-templates`;

      const { data } = await axios[method](url, templateData, config);

      if (data.success) {
        alert("Template saved successfully!");
        // Update template with response data including _id
        const updatedTemplate = {
          ...data.data,
          // Ensure boolean fields are properly converted
          watermarkEnabled: Boolean(data.data.watermarkEnabled),
          showPageNumbers: Boolean(data.data.showPageNumbers),
          showCompanyInfoInFooter: Boolean(data.data.showCompanyInfoInFooter),
          active: Boolean(data.data.active),
          isDefault: Boolean(data.data.isDefault),
          watermarkOpacity: Number(data.data.watermarkOpacity) || 0.1,
          fontSizeBase: Number(data.data.fontSizeBase) || 10,
        };

        setTemplate(updatedTemplate);
        setNoTemplate(false);
        if (data.data.logoUrl) {
          setLogoPreview(data.data.logoUrl); // Cloudinary URL
        }
      }
    } catch (err) {
      console.error("Error saving template:", err);
      alert("Error saving template. Please try again.");
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    }
    setSaving(false);
  };

  // Reset to defaults
  const handleReset = () => {
    if (window.confirm("Reset all changes to default values?")) {
      setTemplate({
        ...template,
        companyName: "",
        companyEmail: "",
        companyPhone: "",
        companyAddress: "",
        companyWebsite: "",
        taxId: "",
        bankDetails: "",
        logoUrl: "",
        watermarkEnabled: true,
        watermarkOpacity: 0.1,
        primaryColor: "#333333",
        secondaryColor: "#666666",
        fontFamily: "Arial",
        fontSizeBase: 10,
        footerText: "Thank you for your business!",
        showPageNumbers: true,
        showCompanyInfoInFooter: true,
        active: true,
        isDefault: true,
      });
      setLogoPreview("");
    }
  };

  // Preview template
  const handlePreview = () => {
    setPreview(!preview);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">
              Loading template configuration...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state when no template exists
  if (noTemplate) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Document Template
        </h2>
        <p className="text-gray-600 mb-6">
          Configure the template for all business documents (Proposals,
          Invoices, Expenses, etc.)
        </p>

        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="mb-6">
            <FaPalette className="text-5xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Template Found
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You haven't created any document templates yet. Click the button
              below to create your first template.
            </p>
            <button
              onClick={handleCreateFirstTemplate}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center justify-center mx-auto"
            >
              <FaPlus className="mr-2" />
              Create Your First Template
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Document Template
      </h2>
      <p className="text-gray-600 mb-6">
        Configure the template for all business documents (Proposals, Invoices,
        Expenses, etc.)
      </p>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-xl font-semibold">Template Preview</h3>
              <button
                onClick={() => setPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <div
                className="bg-white border rounded-lg p-8"
                style={{ fontFamily: template.fontFamily }}
              >
                {/* Header Preview */}
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                  <div className="w-1/3">
                    {logoPreview && (
                      <div className="mb-2">
                        <div className="text-sm text-gray-500 mb-1">Logo:</div>
                        <img
                          src={logoPreview}
                          alt="Company Logo"
                          className="h-12 object-contain"
                        />
                      </div>
                    )}
                  </div>
                  <div className="w-1/3 text-center">
                    <h1
                      className="text-2xl font-bold"
                      style={{ color: template.primaryColor }}
                    >
                      PROPOSAL
                    </h1>
                    <div className="text-sm text-gray-500 mt-1">
                      (Document Type)
                    </div>
                  </div>
                  <div className="w-1/3 text-right">
                    <div className="text-sm">
                      <div className="font-semibold">
                        {template.companyName || "Your Company"}
                      </div>
                      <div className="text-gray-600">
                        {template.companyAddress || "123 Business St."}
                      </div>
                      <div className="text-gray-600">
                        {template.companyEmail || "email@company.com"}
                      </div>
                      <div className="text-gray-600">
                        {template.companyPhone || "+1 (555) 123-4567"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Watermark Preview */}
                {template.watermarkEnabled && logoPreview && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <img
                        src={logoPreview}
                        alt="Watermark"
                        className="opacity-20"
                        style={{ opacity: template.watermarkOpacity }}
                      />
                    </div>

                    {/* Content Area */}
                    <div className="relative z-10">
                      <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-2">
                          Sample Proposal
                        </h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Proposal #:</div>
                            <div>PRO-000001</div>
                          </div>
                          <div>
                            <div className="font-medium">Date:</div>
                            <div>{new Date().toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div className="font-medium">Client:</div>
                            <div>Sample Client Inc.</div>
                          </div>
                          <div>
                            <div className="font-medium">Amount:</div>
                            <div>$1,000.00</div>
                          </div>
                        </div>
                      </div>

                      {/* Sample Table */}
                      <div className="mb-6">
                        <table className="w-full text-sm">
                          <thead>
                            <tr
                              style={{
                                backgroundColor: template.primaryColor,
                                color: "white",
                              }}
                            >
                              <th className="p-2 text-left">Description</th>
                              <th className="p-2 text-right">Qty</th>
                              <th className="p-2 text-right">Rate</th>
                              <th className="p-2 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[1, 2, 3].map((item) => (
                              <tr key={item} className="border-b">
                                <td className="p-2">Sample Item {item}</td>
                                <td className="p-2 text-right">1</td>
                                <td className="p-2 text-right">$100.00</td>
                                <td className="p-2 text-right">$100.00</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="font-semibold">
                              <td colSpan="3" className="p-2 text-right">
                                Total:
                              </td>
                              <td className="p-2 text-right">$300.00</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Preview */}
                <div className="border-t pt-4 mt-8 text-xs text-gray-500">
                  <div className="text-center">{template.footerText}</div>
                  {template.showCompanyInfoInFooter && (
                    <div className="text-center mt-2">
                      {template.companyName} | {template.companyEmail} |{" "}
                      {template.companyPhone}
                    </div>
                  )}
                  {template.showPageNumbers && (
                    <div className="text-center mt-2">Page 1 of 1</div>
                  )}
                </div>
              </div>

              <div className="mt-6 text-sm text-gray-600">
                <p className="mb-2">
                  <strong>Note:</strong> This is a preview of how your documents
                  will look.
                </p>
                <p>
                  The watermark opacity is set to {template.watermarkOpacity}.
                </p>
                <p>
                  Primary color:{" "}
                  <span style={{ color: template.primaryColor }}>
                    {template.primaryColor}
                  </span>
                </p>
                <p>Font family: {template.fontFamily}</p>
              </div>
            </div>
            <div className="border-t p-4 flex justify-end">
              <button
                onClick={() => setPreview(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Company Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FaPalette className="mr-2" /> Company Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  name="templateName"
                  value={template.templateName}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-sm"
                  placeholder="Default Template"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={template.companyName}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded text-sm"
                    placeholder="Your Company Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Email
                  </label>
                  <input
                    type="email"
                    name="companyEmail"
                    value={template.companyEmail}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded text-sm"
                    placeholder="contact@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Phone
                  </label>
                  <input
                    type="text"
                    name="companyPhone"
                    value={template.companyPhone}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded text-sm"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax ID / VAT Number
                  </label>
                  <input
                    type="text"
                    name="taxId"
                    value={template.taxId}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded text-sm"
                    placeholder="TAX-123456789"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Address
                </label>
                <textarea
                  name="companyAddress"
                  value={template.companyAddress}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-sm"
                  rows="2"
                  placeholder="123 Business Street, City, State, ZIP, Country"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Website
                  </label>
                  <input
                    type="url"
                    name="companyWebsite"
                    value={template.companyWebsite}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded text-sm"
                    placeholder="https://company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Details (Optional)
                  </label>
                  <input
                    type="text"
                    name="bankDetails"
                    value={template.bankDetails}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded text-sm"
                    placeholder="Bank Name, Account Number, IBAN, etc."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logo & Watermark Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Logo & Watermark</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Logo
                </label>
                <div className="flex items-center space-x-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center w-48">
                    {logoPreview ? (
                      <div>
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="h-20 mx-auto object-contain"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Current Logo
                        </p>
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        <FaUpload className="mx-auto text-2xl mb-2" />
                        <p className="text-sm">No logo uploaded</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="logoUpload"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="logoUpload"
                      className="px-4 py-2 bg-gray-100 text-gray-800 rounded cursor-pointer hover:bg-gray-200 inline-block"
                    >
                      Choose Logo
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: PNG, max 5MB, transparent background
                    </p>
                    <p className="text-xs text-gray-500">
                      Uploads directly to Cloudinary
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="watermarkEnabled"
                      checked={template.watermarkEnabled}
                      onChange={handleChange}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Enable Watermark
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Show logo as background watermark on documents
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Watermark Opacity
                  </label>
                  <input
                    type="range"
                    name="watermarkOpacity"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={template.watermarkOpacity}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Transparent</span>
                    <span>{template.watermarkOpacity}</span>
                    <span>Visible</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Design & Settings */}
        <div className="space-y-6">
          {/* Design Settings Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Design Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={template.primaryColor}
                    onChange={(e) =>
                      handleColorChange("primaryColor", e.target.value)
                    }
                    className="w-10 h-10 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={template.primaryColor}
                    onChange={(e) =>
                      handleColorChange("primaryColor", e.target.value)
                    }
                    className="flex-1 border px-3 py-2 rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={template.secondaryColor}
                    onChange={(e) =>
                      handleColorChange("secondaryColor", e.target.value)
                    }
                    className="w-10 h-10 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={template.secondaryColor}
                    onChange={(e) =>
                      handleColorChange("secondaryColor", e.target.value)
                    }
                    className="flex-1 border px-3 py-2 rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Family
                </label>
                <select
                  name="fontFamily"
                  value={template.fontFamily}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-sm"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Tahoma">Tahoma</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Font Size
                </label>
                <select
                  name="fontSizeBase"
                  value={template.fontSizeBase}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-sm"
                >
                  <option value="8">8pt</option>
                  <option value="9">9pt</option>
                  <option value="10">10pt</option>
                  <option value="11">11pt</option>
                  <option value="12">12pt</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Settings Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Footer Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Footer Text
                </label>
                <textarea
                  name="footerText"
                  value={template.footerText}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-sm"
                  rows="2"
                  placeholder="Thank you for your business!"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="showCompanyInfoInFooter"
                    checked={template.showCompanyInfoInFooter}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Show company info in footer
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="showPageNumbers"
                    checked={template.showPageNumbers}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Show page numbers
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="active"
                    checked={template.active}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Template is active
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={template.isDefault}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Set as default template
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center"
              >
                <FaSave className="mr-2" />
                {saving
                  ? "Saving..."
                  : template._id
                  ? "Update Template"
                  : "Create Template"}
              </button>

              <button
                onClick={handlePreview}
                className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center justify-center"
              >
                <FaEye className="mr-2" />
                Preview Template
              </button>

              <button
                onClick={handleReset}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center"
              >
                <FaUndo className="mr-2" />
                Reset to Defaults
              </button>
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                This template will be used for:
              </p>
              <ul className="text-sm text-gray-500 mt-2 space-y-1">
                {template.documentTypes.map((type) => (
                  <li key={type} className="flex items-center">
                    <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                    {type}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentTemplate;
