export type AppUserRole = "USER" | "ADMIN" | "ARTIST" | "INFLUENCER" | "VISITOR";

export function normalizeUserRole(role?: string | null): AppUserRole {
  switch (role) {
    case "ADMIN":      return "ADMIN";
    case "ARTIST":     return "ARTIST";
    case "INFLUENCER": return "INFLUENCER";
    case "VISITOR":    return "VISITOR";
    case "READER":
    case "AUTHOR":
    case "COAUTHOR":   return "USER";
    default:           return "USER";
  }
}
