"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/router";

import {
  fetchChat,
  uploadTranscript,
  type ChatNavigationPayload,
} from "@/lib/api";
import { useAuth, type UserRole } from "@/context/AuthContext";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const ROLE_ALLOWED_ROUTE_PATTERNS: Record<UserRole, string[]> = {
  chro: [
    "/",
    "/dashboard",
    "/departments",
    "/department/*",
    "/documents",
    "/ai-insights",
  ],
  hr_partner: [
    "/employees",
    "/employee/*",
    "/meeting-intelligence",
    "/documents",
    "/ai-insights",
  ],
  talent_ops: [
    "/workforce-insights",
    "/employee-insights",
    "/employee/*",
    "/meeting-intelligence",
    "/documents",
    "/ai-insights",
    "/candidates",
  ],
  engagement_manager: [
    "/events",
    "/engagement-analytics",
    "/meeting-intelligence",
    "/documents",
    "/ai-insights",
  ],
};

function routePatternMatches(pattern: string, path: string): boolean {
  if (pattern.endsWith("*")) {
    const prefix = pattern.slice(0, -1);
    return path.startsWith(prefix);
  }
  return pattern === path;
}

function isPathAllowedForRole(path: string, role: UserRole | null | undefined): boolean {
  if (!role || !path) {
    return false;
  }
  const patterns = ROLE_ALLOWED_ROUTE_PATTERNS[role] ?? [];
  return patterns.some((pattern) => routePatternMatches(pattern, path));
}

function resolveNavigationPath(
  navigation: ChatNavigationPayload,
  role: UserRole | null | undefined,
): { targetPath: string | null; note: string } {
  const requestedPath = navigation.path;
  const fallbackPath = navigation.fallback_path;

  if (requestedPath && isPathAllowedForRole(requestedPath, role)) {
    return { targetPath: requestedPath, note: "" };
  }

  if (fallbackPath && isPathAllowedForRole(fallbackPath, role)) {
    return {
      targetPath: fallbackPath,
      note: `\n\nI could not open ${navigation.label} with your current role, so I opened a related page instead.`,
    };
  }

  return {
    targetPath: null,
    note: "\n\nI found a destination, but it is not available for your current role.",
  };
}

export function ChatbotButton() {
  const router = useRouter();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear chat history when toggling open/close
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setInput("");
      setIsUploading(false);
    } else if (messages.length === 0) {
      // Show initial greeting when opening
      setMessages([
        {
          id: "1",
          type: "assistant",
          content: `Hey! I'm SAGE, your HR AI assistant. I can help with:\n• Meeting prep (e.g., "prepare me for a meeting with Alice")\n• Employee insights\n• Engagement analysis\n• Workforce recommendations\n\nFeel free to upload a meeting transcript using the 📎 icon.`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // Add user message about upload
    const uploadId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: uploadId,
        type: "user",
        content: `Uploaded transcript: ${file.name}`,
        timestamp: new Date(),
      },
    ]);

    try {
      const result = await uploadTranscript(file);

      const processedCount = result.processed_employees?.length || 0;
      const employeeList = result.processed_employees?.join(", ") || "None";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `Successfully processed meeting transcript!\n\n• Processed: ${processedCount} employees\n• Participants: ${employeeList}\n\nEmployee digital twins have been updated with new behavioral and engagement insights.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("File upload error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `Sorry, I couldn't process that transcript. ${error instanceof Error ? error.message : "Please try again with a .txt file."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      let assistantResponse = "";
      try {
        // Always route through backend so MCP intent + digital twin context is applied.
        console.log("Sending to chat endpoint:", input);
        const chatResult = await fetchChat(input);
        assistantResponse = chatResult.response;
        console.log(
          "Chat response:",
          chatResult.response.substring(0, 100) + "...",
        );

        if (chatResult.navigation?.should_navigate && chatResult.navigation.path) {
          const { targetPath, note } = resolveNavigationPath(chatResult.navigation, user?.role);
          assistantResponse += note;

          if (targetPath) {
            const currentPath = (router.asPath ?? "").split("?")[0];
            if (currentPath !== targetPath) {
              assistantResponse += `\n\nNavigating to ${targetPath}...`;
              window.setTimeout(() => {
                router.push(targetPath);
              }, 220);
            } else {
              assistantResponse += "\n\nYou are already on that page.";
            }
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
        assistantResponse =
          "Sorry, I encountered an error. Please try again.";
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: assistantResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            "0 10px 30px rgba(225, 99, 74, 0.3)",
            "0 10px 40px rgba(225, 99, 74, 0.5)",
            "0 10px 30px rgba(225, 99, 74, 0.3)",
          ],
        }}
        transition={{
          boxShadow: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
        title={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-40 w-[400px] h-[510px] bg-card rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4 shrink-0">
              <h3 className="text-lg" style={{ fontWeight: 600 }}>
                SAGE AI Assistant
              </h3>
              <p className="text-sm opacity-90">Personalized HR Intelligence</p>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm">
                  <p>Start a conversation...</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                        msg.type === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      <p className="text-xs opacity-70 mt-1">
                        {msg.timestamp.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
              {(isLoading || isUploading) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-accent p-3 rounded-lg flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin text-primary" />
                    {isUploading && (
                      <span className="text-xs">Processing...</span>
                    )}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-border bg-card p-4 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isUploading}
                  className="p-2 rounded-lg bg-accent text-muted-foreground hover:bg-accent/80 disabled:opacity-50 transition-colors"
                  title="Upload transcript"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type message..."
                  disabled={isLoading || isUploading}
                  className="flex-1 px-3 py-2 rounded-lg bg-accent border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || isUploading || !input.trim()}
                  className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                Chat clears when closed
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
