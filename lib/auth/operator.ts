export type Operator = {
  id: string;
  login: string;
  teams: string[];
};

const requiredTeam = process.env.PORTAL_GITHUB_TEAM ?? "platform-operators";

export async function requireOperator(): Promise<Operator> {
  const mode = process.env.PORTAL_AUTH_MODE ?? "dev";
  if (mode === "dev") {
    return {
      id: "dev-operator",
      login: process.env.PORTAL_DEV_OPERATOR ?? "dawnmorality",
      teams: [requiredTeam]
    };
  }

  throw new Error("GitHub SSO is not wired yet. Set PORTAL_AUTH_MODE=dev for local use.");
}
