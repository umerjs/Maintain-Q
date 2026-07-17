import { ADMIN_EMAIL, type UserRole } from "@/data/mockData";

/**
 * Resolve a user's app role from their `user_roles` rows.
 *
 * Special case: the seeded admin account (hammad@code.dev) always
 * resolves to "Admin" regardless of the user_roles table. This is
 * a deliberate exception for the one pre-seeded admin account, NOT
 * a general pattern for future role checks.
 */
export function resolveRole(
  roles: { role: string }[] | null,
  email?: string,
): UserRole {
  if (email?.toLowerCase() === ADMIN_EMAIL) return "Admin";
  if (roles?.some((r) => r.role === "Admin")) return "Admin";
  if (roles?.some((r) => r.role === "Technician")) return "Technician";
  return "Student";
}
