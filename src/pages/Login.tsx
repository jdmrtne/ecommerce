import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useAuth } from "@/context/AuthContext";
import { validateLogin, validateSignup } from "@/lib/auth";
import type { SignupErrors } from "@/lib/auth";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";

type Mode = "login" | "signup";

/**
 * Combined login/signup page - a mode toggle rather than two separate
 * routes, since switching between them is the most common thing someone
 * does here ("oh wait, I don't have an account yet"). Redirects to
 * wherever RequireAuth sent the person from (via location.state.from),
 * defaulting to /account.
 */
export function Login() {
  useSiteMeta(PAGE_META.login);

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<SignupErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/account";

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, redirectTo, navigate]);

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    setFormError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const validationErrors =
      mode === "login" ? validateLogin({ email, password }) : validateSignup({ name, email, password, confirmPassword });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
      // Navigation on success happens via the isAuthenticated effect above.
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow={mode === "login" ? "Welcome back" : "Join us"}
        title={mode === "login" ? "Log in" : "Create your account"}
        align="left"
      />

      <Card padding="lg" className="mt-8">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {mode === "signup" && (
            <Input
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              disabled={isSubmitting}
            />
          )}
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            disabled={isSubmitting}
          />
          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            hint={mode === "signup" ? "At least 6 characters." : undefined}
            disabled={isSubmitting}
          />
          {mode === "signup" && (
            <Input
              type="password"
              label="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              disabled={isSubmitting}
            />
          )}
          {formError && (
            <p role="alert" className="text-sm text-error">
              {formError}
            </p>
          )}
          <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2 w-full">
            {mode === "login" ? "Log in" : "Create account"}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-ink-soft">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="font-semibold text-denim hover:underline"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="font-semibold text-denim hover:underline"
            >
              Log in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
