"use client";

import Link from "next/link";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react"; 
import UserAccountNav from "./UserAccountNav";

export function Navbar() {
  const { data: session, status } = useSession(); 

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-black backdrop-blur-md shadow-md"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-white transition-opacity hover:opacity-80"
          >
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-700 to-green-600 shadow-md">
              <Leaf className="h-5 w-5 text-white" />
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-emerald-500 to-green-400 opacity-50 blur-sm"></div>
            </div>
            <span className="text-md font-bold">PalmLeaf</span>
          </Link>

          <div className="hidden md:block">
            {status === "loading" ? (
              <p className="text-white">Loading...</p>
            ) : session?.user ? (
              <UserAccountNav user={session.user} />
            ) : (
              <Button
                asChild
                className="bg-gradient-to-r from-emerald-800 to-green-700 hover:from-emerald-900 hover:to-green-800 text-white shadow-md"
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
