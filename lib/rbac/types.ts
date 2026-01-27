// Role-Based Access Control Types for Central Authority
// Each role has specific permissions and access levels

export type RoleId = number;

export interface Role {
  id: RoleId;
  name: string;
  slug: string;
  level?: string;
  authorityType?: string;
  description?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: RoleId;
  role?: Role;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface RolePermission {
  roleId: RoleId;
  permissionId: string;
}


// Permission definitions for each role
export const ROLE_PERMISSIONS: Record<RoleId, string[]> = {
  1: [ // Directorate - Full system access
    "full_system_access",
    "create_roles",
    "update_roles",
    "delete_roles",
    "view_all_reports",
    "view_analytics",
    "override_decisions",
    "manage_policies",
    "approve_companies",
    "manage_zones",
  ],
  2: [ // Supervisory Authority - Oversight & approvals
    "read_system_data",
    "approve_operations",
    "reject_operations",
    "suspend_users",
    "flag_users",
    "view_reports",
    "handle_escalations",
  ],
  3: [ // System Administrator - Operational management
    "manage_users",
    "manage_data",
    "create_data",
    "update_data",
    "delete_data",
    "operational_support",
    "view_assigned_data",
  ],
  4: [ // Technical / IT Authority - Infrastructure & maintenance
    "infrastructure_access",
    "configuration_access",
    "deploy_updates",
    "manage_backups",
    "security_measures",
    "limited_data_visibility",
  ],
  5: [ // Audit & Compliance Authority - Logs & transparency
    "read_only_access",
    "view_logs",
    "view_audit_trails",
    "investigate_misuse",
    "compliance_monitoring",
  ],
  6: [ // Data & Analytics Authority - Reporting & insights
    "read_aggregated_data",
    "export_reports",
    "create_dashboards",
    "view_analytics",
    "generate_metrics",
  ],
};

// Helper function to check if a user has a specific permission
export function hasPermission(roleId: RoleId, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[roleId] ?? [];
  // Directorate (role 1) has full access
  if (roleId === 1 && permissions.includes("full_system_access")) {
    return true;
  }
  return permissions.includes(permission);
}

// Helper function to get role by slug
export function getRoleBySlug(roles: Role[], slug: string): Role | undefined {
  return roles.find(role => role.slug === slug);
}

// Helper function to get role route path
export function getRoleRoutePath(role?: Role): string {
  if (!role?.slug) return "/central-authority";
  return `/central-authority/${role.slug}`;
}
