import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Ingreso",
};

export default function AdminLoginPage() {
  return <LoginForm />;
}