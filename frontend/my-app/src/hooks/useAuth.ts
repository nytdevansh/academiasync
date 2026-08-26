export { useAuth } from '../context/AuthContext';
export type { AuthContextType } from '../context/AuthContext';

// Backwards-compatible wrapper so both import styles work across the app.
// The actual implementation lives in AuthContext for consistent state management.