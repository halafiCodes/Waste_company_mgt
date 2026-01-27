// Role-Based Access Control Types for Central Authority
// Each role has specific permissions and access levels

export type RoleId = 1 | 2 | 3 | 4 | 5 | 6;

export interface Role {
  id: RoleId;
  name: string;
  slug: string;
  level: string;
  authorityType: string;
  description: string;
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

// Role definitions with their responsibilities and permissions
export const ROLES: Record<RoleId, Role> = {
  1: {
    id: 1,
    name: "Directorate",
    slug: "directorate",
    level: "Strategic / Policy",
    authorityType: "Highest decision-making body",
    description: "Define system-wide policies, rules, and objectives. Approve major system operations and changes.",
  },
  2: {
    id: 2,
    name: "Supervisory Authority",
    slug: "supervisor",
    level: "Oversight & Control",
    authorityType: "Monitoring and approval",
    description: "Monitor administrative and operational activities. Approve or reject submitted requests and workflows.",
  },
  3: {
    id: 3,
    name: "System Administrator",
    slug: "admin",
    level: "Operational",
    authorityType: "Execution and management",
    description: "Perform day-to-day system operations. Manage user accounts and profiles.",
  },
  4: {
    id: 4,
    name: "Technical / IT Authority",
    slug: "it",
    level: "Infrastructure & Support",
    authorityType: "Technical maintenance",
    description: "Maintain system availability and performance. Manage servers, databases, and backups.",
  },
  5: {
    id: 5,
    name: "Audit & Compliance Authority",
    slug: "audit",
    level: "Independent Oversight",
    authorityType: "Transparency and accountability",
    description: "Monitor system usage and activity logs. Track changes and access history.",
  },
  6: {
    id: 6,
    name: "Data & Analytics Authority",
    slug: "analytics",
    level: "Analytical",
    authorityType: "Reporting and decision support",
    description: "Analyze system data and trends. Generate dashboards and performance metrics.",
  },
};

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
  const permissions = ROLE_PERMISSIONS[roleId];
  // Directorate (role 1) has full access
  if (roleId === 1 && permissions.includes("full_system_access")) {
    return true;
  }
  return permissions.includes(permission);
}

// Helper function to get role by slug
export function getRoleBySlug(slug: string): Role | undefined {
  return Object.values(ROLES).find(role => role.slug === slug);
}

// Helper function to get role route path
export function getRoleRoutePath(roleId: RoleId): string {
  const role = ROLES[roleId];
  return `/central-authority/${role.slug}`;
}

// Mock users for demonstration (would come from database in production)
export const MOCK_CENTRAL_AUTHORITY_USERS: User[] = [
  { id: "CA001", name: "Dr. Alemayehu Tadesse", email: "director@aacma.gov.et", roleId: 1 },
  { id: "CA002", name: "Tigist Worku", email: "supervisor@aacma.gov.et", roleId: 2 },
  { id: "CA003", name: "Bekele Hailu", email: "admin@aacma.gov.et", roleId: 3 },
  { id: "CA004", name: "Yonas Tesfaye", email: "it@aacma.gov.et", roleId: 4 },
  { id: "CA005", name: "Meron Assefa", email: "audit@aacma.gov.et", roleId: 5 },
  { id: "CA006", name: "Samuel Girma", email: "analytics@aacma.gov.et", roleId: 6 },
];
