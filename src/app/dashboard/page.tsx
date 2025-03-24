"use client"; 

import { signOut, useSession } from "next-auth/react";

export default function Dashboard() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    return <p>Access Denied. Please log in.</p>;
  }

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-3xl font-bold text-green-500">Welcome, {session.user?.email}!</h1>
      
      <button
        onClick={() => signOut({ callbackUrl: "/sign-in" })}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
      >
        Sign Out
      </button>
    </div>
  );
}
