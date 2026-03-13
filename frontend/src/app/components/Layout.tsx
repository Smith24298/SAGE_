import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { ChatbotButton } from "./ChatbotButton";

import type { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Sidebar />
      <main className="ml-72 pt-24 px-8 py-8">{children}</main>
      <ChatbotButton />
    </div>
  );
}
