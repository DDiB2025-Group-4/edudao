import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Footer } from "@/components/Footer.tsx";
import Header from "../components/Header";
import TanStackQueryLayout from "../integrations/tanstack-query/layout.tsx";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <div className="h-[100dvh] flex flex-col">
      <Header />

      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <TanStackRouterDevtools />

      <TanStackQueryLayout />
      <Footer />
    </div>
  ),
});
