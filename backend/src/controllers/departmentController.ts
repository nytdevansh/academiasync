import { Response } from 'express';
import Department from '../models/Department';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../services/auditService';

export const getAllDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departments = await Department.find({ isActive: true }).populate('hodRef', 'name email').sort({ name: 1 });
    res.json({ success: true, data: departments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getDepartmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dept = await Department.findById(req.params.id).populate('hodRef', 'name email');
    if (!dept) { res.status(404).json({ success: false, error: 'Department not found' }); return; }
    res.json({ success: true, data: dept });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, hodRef, description } = req.body;
    const exists = await Department.findOne({ code });
    if (exists) { res.status(400).json({ success: false, error: 'Department code already exists' }); return; }
    const dept = await Department.create({ name, code, hodRef, description });
    const populated = await Department.findById(dept._id).populate('hodRef', 'name email');
    await logAudit(req.user?._id, 'create', 'Department', dept._id, `Created department ${name}`, null, dept, req.ip, req.headers['user-agent']);
    res.status(201).json({ success: true, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prev = await Department.findById(req.params.id);
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('hodRef', 'name email');
    if (!dept) { res.status(404).json({ success: false, error: 'Department not found' }); return; }
    await logAudit(req.user?._id, 'update', 'Department', req.params.id, `Updated department`, prev, dept, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: dept });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Department.findByIdAndUpdate(req.params.id, { isActive: false });
    await logAudit(req.user?._id, 'delete', 'Department', req.params.id, 'Deactivated department', null, null, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: { message: 'Department deactivated' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
