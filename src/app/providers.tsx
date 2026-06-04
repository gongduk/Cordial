"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import axios from "axios";

function OAuthTokenBootstrap() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem("cordial_access_token")) return;

    axios.post<{ accessToken: string }>("/api/auth/token")
      .then(({ data }) => localStorage.setItem("cordial_access_token", data.accessToken))
      .catch(() => { /* ignore */ });
  }, [status]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 1000 * 60 } } }));
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <OAuthTokenBootstrap />
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
}
