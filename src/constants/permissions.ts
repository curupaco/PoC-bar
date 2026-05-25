import { UserPermission } from '../types';

export const ALL_PERMISSIONS: UserPermission[] = [
  'dashboard', 'pos', 'products', 'history', 'reports', 'settings',
  'users_admin', 'shifts_admin', 'cash_admin', 'open_shift', 'close_shift',
  'delete_sale', 'delete_product', 'edit_product', 'export_report',
  'clear_fiado', 'full_reset', 'manage_backup', 'help_view', 'manage_units', 'view_audit_logs', 'franchise_admin',
  'toggle_event_mode', 'inventory_view', 'inventory_manage', 'view_financial_costs', 'manage_debt_reminders'
];
