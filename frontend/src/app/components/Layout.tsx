import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { ChatbotButton } from "./ChatbotButton";

import type { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Sidebar />
      <main className="ml-64 pt-24 p-8">{children}</main>
      <ChatbotButton />
    </div>
  );
}
