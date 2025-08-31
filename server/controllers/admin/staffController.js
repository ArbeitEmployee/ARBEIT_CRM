import Staff from '../../models/Staff.js';
import XLSX from 'xlsx';
import { Readable } from 'stream';

// Parse CSV manually (alternative to csv-parser)
const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const readableStream = Readable.from(buffer.toString());
    
    let headers = [];
    let isFirstLine = true;
    let lineBuffer = '';
    
    readableStream.on('data', (chunk) => {
      lineBuffer += chunk;
      const lines = lineBuffer.split(/\r?\n/);
      
      // Keep the last incomplete line in the buffer
      lineBuffer = lines.pop() || '';
      
      for (const line of lines) {
        if (isFirstLine) {
          headers = line.split(',').map(header => header.trim());
          isFirstLine = false;
        } else if (line.trim()) {
          const values = line.split(',').map(value => value.trim());
          const row = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          results.push(row);
        }
      }
    });
    
    readableStream.on('end', () => {
      // Process any remaining line in the buffer
      if (lineBuffer.trim() && !isFirstLine) {
        const values = lineBuffer.split(',').map(value => value.trim());
        const row = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        results.push(row);
      }
      resolve(results);
    });
    
    readableStream.on('error', reject);
  });
};

// Get all staffs with statistics
export const getAllStaffs = async (req, res) => {
  try {
    const staffs = await Staff.find().sort({ dateCreated: -1 });
    
    // Calculate statistics
    const totalStaffs = await Staff.countDocuments();
    const activeStaffs = await Staff.countDocuments({ active: true });
    const inactiveStaffs = totalStaffs - activeStaffs;
    
    res.status(200).json({
      success: true,
      staffs,
      stats: {
        totalStaffs,
        activeStaffs,
        inactiveStaffs
      }
    });
  } catch (error) {
    console.error('Error fetching staffs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching staffs'
    });
  }
};

// Get single staff by ID
export const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }
    
    res.status(200).json({
      success: true,
      staff
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching staff'
    });
  }
};

// Create new staff
export const createStaff = async (req, res) => {
  try {
    const { name, position, department, phone, email, active } = req.body;
    
    // Check if staff with email already exists
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: 'Staff with this email already exists'
      });
    }
    
    const newStaff = new Staff({
      name,
      position,
      department,
      phone,
      email,
      active: active !== undefined ? active : true
    });
    
    await newStaff.save();
    
    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      staff: newStaff
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(val => val.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating staff'
    });
  }
};

// Update staff
export const updateStaff = async (req, res) => {
  try {
    const { name, position, department, phone, email, active } = req.body;
    
    // Check if email is being changed to one that already exists
    if (email) {
      const existingStaff = await Staff.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingStaff) {
        return res.status(400).json({
          success: false,
          message: 'Another staff with this email already exists'
        });
      }
    }
    
    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.id,
      { name, position, department, phone, email, active },
      { new: true, runValidators: true }
    );
    
    if (!updatedStaff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Staff updated successfully',
      staff: updatedStaff
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(val => val.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating staff'
    });
  }
};

// Toggle staff active status
export const toggleStaffActive = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }
    
    staff.active = !staff.active;
    await staff.save();
    
    res.status(200).json({
      success: true,
      message: `Staff ${staff.active ? 'activated' : 'deactivated'} successfully`,
      staff
    });
  } catch (error) {
    console.error('Error toggling staff status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating staff status'
    });
  }
};

// Delete staff
export const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Staff deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting staff'
    });
  }
};

// Import staffs from CSV/Excel
export const importStaffs = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const fileBuffer = req.file.buffer;
    const results = [];
    const errorMessages = [];
    
    // Check file extension to determine if it's CSV or Excel
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    
    if (fileExtension === 'csv') {
      // Process CSV file using our custom parser
      try {
        const csvResults = await parseCSV(fileBuffer);
        results.push(...csvResults);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: 'Error parsing CSV file'
        });
      }
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      // Process Excel file
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      results.push(...XLSX.utils.sheet_to_json(worksheet));
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid file format. Please upload a CSV or Excel file'
      });
    }
    
    // Process and validate each record
    const staffsToImport = [];
    
    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const rowNumber = i + 1;
      
      // Validate required fields
      if (!row.name || !row.email) {
        errorMessages.push(`Row ${rowNumber}: Name and Email are required`);
        continue;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        errorMessages.push(`Row ${rowNumber}: Invalid email format (${row.email})`);
        continue;
      }
      
      // Check for duplicate email in import batch
      const duplicateInBatch = staffsToImport.some(staff => staff.email === row.email.toLowerCase());
      if (duplicateInBatch) {
        errorMessages.push(`Row ${rowNumber}: Duplicate email in import file (${row.email})`);
        continue;
      }
      
      // Check if staff already exists in database
      const existingStaff = await Staff.findOne({ email: row.email.toLowerCase() });
      if (existingStaff) {
        errorMessages.push(`Row ${rowNumber}: Staff with email ${row.email} already exists`);
        continue;
      }
      
      staffsToImport.push({
        name: row.name,
        position: row.position || '',
        department: row.department || '',
        phone: row.phone || '',
        email: row.email.toLowerCase(),
        active: row.active !== undefined ? String(row.active).toLowerCase() === 'true' : true
      });
    }
    
    // Insert valid records
    let importedCount = 0;
    if (staffsToImport.length > 0) {
      const result = await Staff.insertMany(staffsToImport, { ordered: false });
      importedCount = result.length;
    }
    
    res.status(200).json({
      success: true,
      importedCount,
      errorCount: errorMessages.length,
      errorMessages: errorMessages.length > 0 ? errorMessages : undefined
    });
    
  } catch (error) {
    console.error('Error importing staffs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while importing staffs'
    });
  }
};