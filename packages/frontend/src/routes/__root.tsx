import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";
import { Footer } from "@/components/Footer.tsx";
import Header from "../components/Header";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <div className="flex h-[100dvh] flex-col">
      <Header />

      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <TanStackRouterDevtools />

      <ReactQueryDevtools buttonPosition="bottom-right" />
      <Footer />
      <Toaster />
    </div>
  ),
});
