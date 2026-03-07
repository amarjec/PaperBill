import { useAuth } from '../context/AuthContext';

/**
 * usePermission
 *
 * Returns a `can(module, action)` function.
 * Owners → always true.
 * Staff  → checks their permissions object from the session.
 *
 * Modules : 'customers' | 'products' | 'bills' | 'khata' | 'category' | 'subCategory'
 * Actions : 'create' | 'read' | 'update' | 'delete'
 *
 * Usage:
 *   const { can } = usePermission();
 *   {can('customers', 'create') && <Pressable>Add Customer</Pressable>}
 */
export function usePermission() {
  const { user } = useAuth();

  const can = (module, action) => {
    if (!user) return false;
    if (user.address) return true;
    return !!user.permissions?.[module]?.[action];
  };

  return { can };
}