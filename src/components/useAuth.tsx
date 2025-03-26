import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useAuth = (allowedRoles: string[]) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    console.log(session?.user.role)

    if (!session || !allowedRoles.includes(session.user?.role)) {
      router.push("/unauthorized");
    }
  }, [session, status, router, allowedRoles]);

  return { session, status };
};
