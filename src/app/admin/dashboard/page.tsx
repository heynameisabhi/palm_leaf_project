"use client";

import { useAuth } from "@/components/useAuth";
import { useSession } from "next-auth/react";

export default function Dashboard() {
  // only the users with the role as admin can view this page
  useAuth(["admin"]);

  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    return <p>Access Denied. Please log in.</p>;
  }

  return (
    <div className="flex flex-col items-center pt-20 bg-black w-full h-screen">
      <h1 className="text-3xl font-bold text-green-500">
        Welcome Admin, {session.user?.email}!
      </h1>
    </div>
  );
}
