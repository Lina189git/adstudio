export type AppUserRole = "USER" | "ADMIN" | "VISITOR";

export function normalizeUserRole(role?: string | null): AppUserRole {
  switch (role) {
    case "ADMIN":
      return "ADMIN";
    case "VISITOR":
      return "VISITOR";
    case "READER":
    case "AUTHOR":
    case "COAUTHOR":
      return "USER";
    default:
      return "USER";
  }
}
