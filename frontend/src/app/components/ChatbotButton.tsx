import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            '0 10px 30px rgba(225, 99, 74, 0.3)',
            '0 10px 40px rgba(225, 99, 74, 0.5)',
            '0 10px 30px rgba(225, 99, 74, 0.3)',
          ],
        }}
        transition={{
          boxShadow: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-40 w-96 h-[500px] bg-card rounded-xl shadow-2xl border border-border overflow-hidden"
          >
            <div className="bg-primary text-primary-foreground p-4">
              <h3 className="text-lg" style={{ fontWeight: 600 }}>SAGE AI Assistant</h3>
              <p className="text-sm opacity-90">How can I help you today?</p>
            </div>
            <div className="p-4 h-[calc(100%-140px)] overflow-y-auto">
              <div className="space-y-4">
                <div className="bg-accent p-3 rounded-lg">
                  <p className="text-sm">Hello! I'm SAGE, your AI assistant for HR intelligence. I can help you with:</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>• Employee sentiment analysis</li>
                    <li>• Workforce insights</li>
                    <li>• Engagement recommendations</li>
                    <li>• Meeting preparation</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
              <input
                type="text"
                placeholder="Type your message..."
                className="w-full px-4 py-2 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
