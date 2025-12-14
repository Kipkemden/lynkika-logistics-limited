// Enterprise-grade Role-Based Access Control (RBAC) System

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  OPERATIONS_MANAGER: 'operations_manager',
  DISPATCHER: 'dispatcher'
};

export const PERMISSIONS = {
  // Dashboard permissions
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_ANALYTICS: 'view_analytics',
  
  // Route management permissions
  VIEW_ROUTES: 'view_routes',
  CREATE_ROUTES: 'create_routes',
  EDIT_ROUTES: 'edit_routes',
  DELETE_ROUTES: 'delete_routes',
  ACTIVATE_DEACTIVATE_ROUTES: 'activate_deactivate_routes',
  
  // Booking management permissions
  VIEW_ALL_BOOKINGS: 'view_all_bookings',
  VIEW_OWN_BOOKINGS: 'view_own_bookings',
  CREATE_BOOKINGS: 'create_bookings',
  EDIT_BOOKINGS: 'edit_bookings',
  UPDATE_BOOKING_STATUS: 'update_booking_status',
  CANCEL_BOOKINGS: 'cancel_bookings',
  ASSIGN_VEHICLES: 'assign_vehicles',
  
  // Quote management permissions
  VIEW_ALL_QUOTES: 'view_all_quotes',
  PROCESS_QUOTES: 'process_quotes',
  APPROVE_QUOTES: 'approve_quotes',
  
  // User management permissions
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  
  // Courier permissions
  CREATE_COURIER_SHIPMENTS: 'create_courier_shipments',
  
  // Financial permissions
  VIEW_PRICING: 'view_pricing',
  EDIT_PRICING: 'edit_pricing',
  VIEW_FINANCIAL_REPORTS: 'view_financial_reports',
  
  // System permissions
  VIEW_SYSTEM_LOGS: 'view_system_logs',
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings'
};

// Role-based permission mapping
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Full access to everything
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_ROUTES,
    PERMISSIONS.CREATE_ROUTES,
    PERMISSIONS.EDIT_ROUTES,
    PERMISSIONS.DELETE_ROUTES,
    PERMISSIONS.ACTIVATE_DEACTIVATE_ROUTES,
    PERMISSIONS.VIEW_ALL_BOOKINGS,
    PERMISSIONS.CREATE_BOOKINGS,
    PERMISSIONS.EDIT_BOOKINGS,
    PERMISSIONS.UPDATE_BOOKING_STATUS,
    PERMISSIONS.CANCEL_BOOKINGS,
    PERMISSIONS.ASSIGN_VEHICLES,
    PERMISSIONS.VIEW_ALL_QUOTES,
    PERMISSIONS.PROCESS_QUOTES,
    PERMISSIONS.APPROVE_QUOTES,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.CREATE_COURIER_SHIPMENTS,
    PERMISSIONS.VIEW_PRICING,
    PERMISSIONS.EDIT_PRICING,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.VIEW_SYSTEM_LOGS,
    PERMISSIONS.MANAGE_SYSTEM_SETTINGS
  ],
  
  [ROLES.OPERATIONS_MANAGER]: [
    // Operations and strategic oversight
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_ROUTES,
    PERMISSIONS.CREATE_ROUTES,
    PERMISSIONS.EDIT_ROUTES,
    PERMISSIONS.ACTIVATE_DEACTIVATE_ROUTES,
    PERMISSIONS.VIEW_ALL_BOOKINGS,
    PERMISSIONS.CREATE_BOOKINGS,
    PERMISSIONS.EDIT_BOOKINGS,
    PERMISSIONS.UPDATE_BOOKING_STATUS,
    PERMISSIONS.CANCEL_BOOKINGS,
    PERMISSIONS.ASSIGN_VEHICLES,
    PERMISSIONS.VIEW_ALL_QUOTES,
    PERMISSIONS.PROCESS_QUOTES,
    PERMISSIONS.APPROVE_QUOTES,
    PERMISSIONS.CREATE_COURIER_SHIPMENTS,
    PERMISSIONS.VIEW_PRICING,
    PERMISSIONS.EDIT_PRICING,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS
  ],
  
  [ROLES.DISPATCHER]: [
    // Day-to-day operations only
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ROUTES, // Read-only
    PERMISSIONS.VIEW_ALL_BOOKINGS,
    PERMISSIONS.CREATE_BOOKINGS,
    PERMISSIONS.UPDATE_BOOKING_STATUS,
    PERMISSIONS.ASSIGN_VEHICLES,
    PERMISSIONS.CREATE_COURIER_SHIPMENTS,
    PERMISSIONS.VIEW_PRICING // Read-only
  ]
};

// Utility functions
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

export const hasAnyPermission = (userRole, permissions) => {
  if (!userRole || !permissions || !Array.isArray(permissions)) return false;
  return permissions.some(permission => hasPermission(userRole, permission));
};

export const hasAllPermissions = (userRole, permissions) => {
  if (!userRole || !permissions || !Array.isArray(permissions)) return false;
  return permissions.every(permission => hasPermission(userRole, permission));
};

export const getRoleDisplayName = (role) => {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return 'Super Administrator';
    case ROLES.OPERATIONS_MANAGER:
      return 'Operations Manager';
    case ROLES.DISPATCHER:
      return 'Dispatcher';
    default:
      return 'Unknown Role';
  }
};

export const getRoleDescription = (role) => {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return 'Full system access including user management and system configuration';
    case ROLES.OPERATIONS_MANAGER:
      return 'Strategic oversight of routes, pricing, and operational decisions';
    case ROLES.DISPATCHER:
      return 'Day-to-day booking management and shipment coordination';
    default:
      return '';
  }
};

// Permission-based component wrapper
export const PermissionGate = ({ userRole, requiredPermission, children, fallback = null }) => {
  if (hasPermission(userRole, requiredPermission)) {
    return children;
  }
  return fallback;
};