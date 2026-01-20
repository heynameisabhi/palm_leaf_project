import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const useAuth = (allowedRoles: string[]) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Wait until session is no longer loading
    if (status === "loading") return;

    console.log("Current user role:", session?.user?.role);
    console.log("Allowed roles:", allowedRoles);
    
    // Check if user is authorized
    const authorized = session && allowedRoles.includes(session.user?.role);
    setIsAuthorized(authorized);
    
    // If not authorized, redirect
    if (!authorized) {
      router.push("/unauthorized");
    }
  }, [session, status, router, allowedRoles]);

  return { session, status, isAuthorized };
};