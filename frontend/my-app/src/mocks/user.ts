import type { User } from '../types';
export const mockUser: User = { _id: 'u1', name: 'Dr. John Doe', email: 'john@example.com', role: 'faculty_member', status: 'active', department: { _id: 'd1', name: 'Computer Science', code: 'CS', isActive: true } };
