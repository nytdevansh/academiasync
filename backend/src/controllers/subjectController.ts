import { Response } from 'express';
import Subject from '../models/Subject';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../services/auditService';

export const getAllSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subjects = await Subject.find({ isActive: true }).populate('department', 'name code').sort({ name: 1 });
    res.json({ success: true, data: subjects });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getSubjectsByDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subjects = await Subject.find({ department: req.params.deptId, isActive: true }).populate('department', 'name code');
    res.json({ success: true, data: subjects });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subject = await Subject.create(req.body);
    await logAudit(req.user?._id, 'create', 'Subject', subject._id, `Created subject ${subject.name}`, null, subject, req.ip, req.headers['user-agent']);
    res.status(201).json({ success: true, data: subject });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prev = await Subject.findById(req.params.id);
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) { res.status(404).json({ success: false, error: 'Subject not found' }); return; }
    await logAudit(req.user?._id, 'update', 'Subject', req.params.id, 'Updated subject', prev, subject, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: subject });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Subject.findByIdAndUpdate(req.params.id, { isActive: false });
    await logAudit(req.user?._id, 'delete', 'Subject', req.params.id, 'Deactivated subject', null, null, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: { message: 'Subject deactivated' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
