/**
 * /login — Unified auth redirect
 * FeeKiller.ai shares the Apex OS authentication gateway.
 * No separate login screen — one account unlocks both apps.
 */
import { redirect } from "next/navigation";

export const metadata = {
  title: "Sign In — FeeKiller.ai",
  description: "Sign in via your Aquarius OS unified account.",
};

const APEX_LOGIN = "https://axon-two-sable.vercel.app/login";

export default function LoginPage() {
  redirect(APEX_LOGIN);
}
