export type Operator = {
  id: string;
  login: string;
  teams: string[];
};

const requiredTeam = process.env.PORTAL_GITHUB_TEAM ?? "platform-operators";

export async function requireOperator(): Promise<Operator> {
  const mode = process.env.PORTAL_AUTH_MODE
    ?? (process.env.NODE_ENV === "production" ? "prod" : "dev");
  if (mode === "dev" && process.env.NODE_ENV === "production") {
    throw new Error("PORTAL_AUTH_MODE=dev is not allowed when NODE_ENV=production");
  }
  if (mode === "dev") {
    return {
      id: "dev-operator",
      login: process.env.PORTAL_DEV_OPERATOR ?? "dawnmorality",
      teams: [requiredTeam]
    };
  }

  throw new Error("GitHub SSO is not wired yet. Set PORTAL_AUTH_MODE=dev for local use.");
}
