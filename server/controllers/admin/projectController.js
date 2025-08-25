import Project from "../../models/Project.js";
import Customer from "../../models/Customer.js";
import XLSX from "xlsx";

// @desc    Get all projects with customer details
// @route   GET /api/projects
// @access  Public
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({})
      .populate('customer', 'company contact email phone')
      .sort({ createdAt: -1 });
    
    res.json({
      projects
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Server error while fetching projects" });
  }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Public
export const createProject = async (req, res) => {
  try {
    const { name, customerId, tags, startDate, deadline, members, status } = req.body;
    
    if (!name || !customerId) {
      return res.status(400).json({ 
        message: "Name and customer are required fields" 
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const project = new Project({
      name,
      customerId,
      tags: tags || "",
      startDate: startDate ? new Date(startDate) : null,
      deadline: deadline ? new Date(deadline) : null,
      members: members || "",
      status: status || "Progress",
      notes: req.body.notes || ""
    });

    const createdProject = await project.save();
    const populatedProject = await Project.findById(createdProject._id)
      .populate('customer', 'company contact email phone');
      
    res.status(201).json(populatedProject);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Import projects from CSV
// @route   POST /api/projects/import
// @access  Public
export const importProjects = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (!jsonData.length) {
      return res.status(400).json({ message: "CSV file is empty" });
    }

    // Validate required fields
    const requiredFields = ['Name', 'Customer'];
    const missingFields = requiredFields.filter(field => !jsonData[0].hasOwnProperty(field));
    
    if (missingFields.length) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Process each row
    const importedProjects = [];
    const errorMessages = [];

    for (const [index, row] of jsonData.entries()) {
      const rowNumber = index + 2; // Excel rows start at 1, header is row 1
      
      // Skip if required fields are missing
      if (!row.Name || !row.Customer) {
        errorMessages.push(`Row ${rowNumber}: Missing required fields`);
        continue;
      }

      // Find customer by company name
      let customer;
      try {
        customer = await Customer.findOne({ 
          company: { $regex: new RegExp(row.Customer, 'i') } 
        });
        
        if (!customer) {
          errorMessages.push(`Row ${rowNumber}: Customer "${row.Customer}" not found`);
          continue;
        }
      } catch (error) {
        errorMessages.push(`Row ${rowNumber}: Error finding customer - ${error.message}`);
        continue;
      }

      // Validate status
      const validStatuses = [
        "Progress", "Last Started", "On Hold", "Cancelled", "Finished"
      ];
      
      if (row.Status && !validStatuses.includes(row.Status)) {
        errorMessages.push(`Row ${rowNumber}: Invalid status "${row.Status}"`);
        continue;
      }

      // Parse dates
      let startDate;
      let deadlineDate;
      
      try {
        if (row['Start Date']) {
          startDate = new Date(row['Start Date']);
          if (isNaN(startDate.getTime())) {
            errorMessages.push(`Row ${rowNumber}: Invalid Start Date format`);
            continue;
          }
        }
        
        if (row['Deadline']) {
          deadlineDate = new Date(row['Deadline']);
          if (isNaN(deadlineDate.getTime())) {
            errorMessages.push(`Row ${rowNumber}: Invalid Deadline format`);
            continue;
          }
        }
      } catch (error) {
        errorMessages.push(`Row ${rowNumber}: Error parsing dates - ${error.message}`);
        continue;
      }

      const projectData = {
        name: row.Name,
        customerId: customer._id,
        tags: row.Tags || "",
        startDate: startDate || null,
        deadline: deadlineDate || null,
        members: row.Members || "",
        status: row.Status || "Progress",
        notes: row.Notes || ""
      };

      try {
        const project = new Project(projectData);
        const savedProject = await project.save();
        const populatedProject = await Project.findById(savedProject._id)
          .populate('customer', 'company contact email phone');
          
        importedProjects.push(populatedProject);
      } catch (error) {
        const errorMsg = error.message.includes("validation failed") 
          ? `Row ${rowNumber}: Validation error - ${error.message.split(': ')[2]}`
          : `Row ${rowNumber}: ${error.message}`;
        errorMessages.push(errorMsg);
      }
    }

    res.status(201).json({
      message: `Import completed with ${importedProjects.length} successful and ${errorMessages.length} failed`,
      importedCount: importedProjects.length,
      errorCount: errorMessages.length,
      errorMessages,
      importedProjects
    });

  } catch (error) {
    console.error("Error importing projects:", error);
    res.status(500).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : "Server error while importing projects" 
    });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Public
export const updateProject = async (req, res) => {
  try {
    const { name, customerId, tags, startDate, deadline, members, status } = req.body;
    
    if (!name || !customerId) {
      return res.status(400).json({ 
        message: "Name and customer are required fields" 
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.name = name;
    project.customerId = customerId;
    project.tags = tags || "";
    project.members = members || "";
    project.status = status || "Progress";
    project.notes = req.body.notes || "";
    
    if (startDate) {
      project.startDate = new Date(startDate);
    } else {
      project.startDate = null;
    }
    
    if (deadline) {
      project.deadline = new Date(deadline);
    } else {
      project.deadline = null;
    }

    const updatedProject = await project.save();
    const populatedProject = await Project.findById(updatedProject._id)
      .populate('customer', 'company contact email phone');
      
    res.json(populatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Public
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await Project.deleteOne({ _id: req.params.id });
    res.json({ message: "Project removed successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Server error while deleting project" });
  }
};

// @desc    Search customers by company name
// @route   GET /api/projects/customers/search
// @access  Public
export const searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const customers = await Customer.find({
      company: { $regex: q, $options: 'i' }
    }).select('company contact email phone').limit(10);
    
    res.json(customers);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ message: "Server error while searching customers" });
  }
};