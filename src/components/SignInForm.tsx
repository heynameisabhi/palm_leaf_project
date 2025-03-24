"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User, Loader2 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { data: session } = useSession();

  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const response = await signIn("credentials", {
      username: user.username,
      email: user.email,
      password: user.password,
      redirect: false,
    });

    setIsLoading(false);

    if (response?.error) {
      console.log(response.error);
      toast.error("Login failed: " + response.error);
    } else {
      if (session?.user.role === "admin") {
        toast.success("Login successful! welcom Admin.");
        router.push("/admin/dashboard");
      } else {
        toast.success("Login successful!");
        router.push("/dashboard");
      }
    }
  };

  return (
    <Card className="border-none bg-zinc-900/80 backdrop-blur-sm text-white shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold">
          Sign in{" "}
          <span className="text-[15px] text-green-600">
            to Palmleaf transcript
          </span>
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-zinc-300">
                Username
              </Label>
              <div className="relative flex items-center">
                <User className="absolute left-3 top-2 h-5 w-5 text-zinc-500" />
                <Input
                  id="username"
                  placeholder="username"
                  type="text"
                  autoCapitalize="none"
                  autoComplete="username"
                  autoCorrect="off"
                  onChange={(e) =>
                    setUser({ ...user, username: e.target.value })
                  }
                  value={user.username}
                  disabled={isLoading}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:ring-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2 h-5 w-5 text-zinc-500" />
                <Input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  value={user.email}
                  disabled={isLoading}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:ring-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-zinc-300">
                  Password
                </Label>
                <Link
                  href="#"
                  className="text-sm text-emerald-500 hover:text-emerald-400"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2 h-5 w-5 text-zinc-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  onChange={(e) =>
                    setUser({ ...user, password: e.target.value })
                  }
                  disabled={isLoading}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:ring-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1 h-7 w-7 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={
                isLoading || !user.username || !user.email || !user.password
              }
              className={cn(
                "w-full font-semibold cursor-pointer",
                "bg-gradient-to-r from-emerald-900 to-green-600 hover:from-emerald-900 hover:to-green-800",
                "border-0 text-white shadow-md"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 border-t border-zinc-800 pt-4">
        <p className="text-center text-xs text-zinc-500">
          By signing in, you agree to our{" "}
          <Link
            href="#"
            className="underline underline-offset-2 hover:text-zinc-400"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="#"
            className="underline underline-offset-2 hover:text-zinc-400"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </CardFooter>
    </Card>
  );
}
