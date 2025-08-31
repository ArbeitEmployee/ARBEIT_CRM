import express from 'express';
import multer from 'multer';
import {
  getAllStaffs,
  getStaffById,
  createStaff,
  updateStaff,
  toggleStaffActive,
  deleteStaff,
  importStaffs
} from '../../controllers/admin/staffController.js';



const upload = multer();

const router = express.Router();



// GET /api/staffs - Get all staffs
router.get('/', getAllStaffs);

// GET /api/staffs/:id - Get single staff
router.get('/:id', getStaffById);

// POST /api/staffs - Create new staff
router.post('/', createStaff);

// PUT /api/staffs/:id - Update staff
router.put('/:id', updateStaff);

// PUT /api/staffs/:id/active - Toggle staff active status
router.put('/:id/active', toggleStaffActive);

// DELETE /api/staffs/:id - Delete staff
router.delete('/:id', deleteStaff);

// POST /api/staffs/import - Import staffs from CSV/Excel
router.post('/import', upload.single('file'), importStaffs);

export default router;