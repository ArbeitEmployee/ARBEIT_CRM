import Project from "../../models/Project.js";
import Customer from "../../models/Customer.js";
import Client from "../../models/Client.js";

// @desc    Get all projects for a specific client (filtered by their admin)
// @route   GET /api/client/projects
// @access  Private (Client)
export const getClientProjects = async (req, res) => {
  try {
    const { search, status } = req.query;
    const clientId = req.client._id; // From client auth middleware
    
    console.log("Client ID:", clientId);
    
    // First, get the client's details to find their associated customer
    const client = await Client.findById(clientId).populate('customer');
    
    console.log("Client found:", client ? "Yes" : "No");
    console.log("Customer populated:", client?.customer ? "Yes" : "No");
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    if (!client.customer) {
      return res.status(404).json({ 
        message: "Client not associated with any customer",
        debug: {
          clientId: client._id,
          customerField: client.customer,
          customerCodeField: client.customerCode
        }
      });
    }
    
    // Build filter for projects - use the customer ID that the client is associated with
    let filter = { 
      admin: client.admin,
      customerId: client.customer._id  // Use the customer ID from client.customer
    };
    
    console.log("Filter used:", filter);
    
    if (status && status !== "All") {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ];
    }
    
    const projects = await Project.find(filter)
      .populate('customer', 'company contact email phone customerCode')
      .sort({ createdAt: -1 });
    
    console.log("Projects found:", projects.length);
    
    // Calculate stats for this specific customer
    const totalProjects = await Project.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id 
    });
    
    const progressProjects = await Project.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id,
      status: "Progress" 
    });
    
    const onHoldProjects = await Project.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id,
      status: "On Hold" 
    });
    
    const cancelledProjects = await Project.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id,
      status: "Cancelled" 
    });
    
    const finishedProjects = await Project.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id,
      status: "Finished" 
    });
    
    res.json({
      projects,
      stats: {
        totalProjects,
        progressProjects,
        onHoldProjects,
        cancelledProjects,
        finishedProjects
      },
      clientInfo: {
        company: client.customer.company,
        contact: client.customer.contact,
        email: client.customer.email,
        phone: client.customer.phone,
        customerCode: client.customer.customerCode
      }
    });
  } catch (error) {
    console.error("Error fetching client projects:", error);
    res.status(500).json({ 
      message: "Server error while fetching projects",
      error: error.message 
    });
  }
};

// @desc    Get single project for client
// @route   GET /api/client/projects/:id
// @access  Private (Client)
export const getClientProject = async (req, res) => {
  try {
    const clientId = req.client._id;
    const projectId = req.params.id;
    
    // Get client with customer info
    const client = await Client.findById(clientId).populate('customer');
    
    if (!client || !client.customer) {
      return res.status(404).json({ message: "Client or customer not found" });
    }
    
    // Find project that belongs to this client's customer
    const project = await Project.findOne({
      _id: projectId,
      admin: client.admin,
      customerId: client.customer._id
    }).populate('customer', 'company contact email phone customerCode');
    
    if (!project) {
      return res.status(404).json({ message: "Project not found or access denied" });
    }
    
    res.json(project);
  } catch (error) {
    console.error("Error fetching client project:", error);
    res.status(500).json({ 
      message: "Server error while fetching project",
      error: error.message 
    });
  }
};