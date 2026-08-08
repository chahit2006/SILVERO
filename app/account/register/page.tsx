import { RegisterForm } from "@/components/account/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="mb-6 font-display text-2xl">Create Account</h1>
      <RegisterForm />
    </div>
  );
}
