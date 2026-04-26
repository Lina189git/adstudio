import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignInForm from "@/components/SignInForm";

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#faf6ef] flex items-center justify-center px-4">
      <div className="w-full max-w-4xl grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-[#e3d5be] bg-[radial-gradient(circle_at_top_left,_rgba(212,165,116,0.2),_transparent_35%),linear-gradient(135deg,#fffaf2_0%,#f4ebde_100%)] p-8 text-left shadow-[0_24px_70px_rgba(26,22,20,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#a87945]">
            Account Access
          </p>
          <h1 className="mt-4 text-3xl font-bold text-[#1a1614]">
            Welcome Back
          </h1>
          <p className="mt-3 text-[#6b5d54]">
            Sign in with Google or use your email and password to continue.
          </p>

          <div className="mt-8 rounded-[1.5rem] border border-[#eadfcb] bg-white/80 p-5">
            <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-[#8c7764]">
              Sign-in methods
            </h2>
            <p className="mt-2 text-sm text-[#5d5148]">
              Use Google for faster access, or sign in with your registered email and password.
            </p>
          </div>
        </div>

        <div className="w-full max-w-md lg:justify-self-end">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
