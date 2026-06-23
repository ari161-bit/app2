import AuthGateway from "../../src/components/AuthGateway";

export const metadata = {
  title: "Sign In — FeeKiller.ai",
  description: "Sign in or create your Aquarius OS account.",
};

export default function LoginPage() {
  return <AuthGateway />;
}
