import { Card } from "../components/ui/card";
import { Shield, Key, CheckCircle2, XCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";

const scrollVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function Migrations() {
  const [zohoKey, setZohoKey] = useState("zoho_live_490110_47a152e48569");
  const [showZohoKey, setShowZohoKey] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const handleConnect = () => {
    if (isConnected) {
      setIsConnected(false);
      return;
    }
    
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 600 }}>
          Migrations
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your external API connections and security settings
        </p>
      </div>

      <motion.div
        variants={scrollVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6 shadow-md border-border/60">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">API Integrations</h2>
              <p className="text-xs text-muted-foreground">Connected external services and API keys</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Zoho People Container */}
            <div className="p-5 bg-accent/50 rounded-xl border border-border/50 hover:border-primary/30 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-border overflow-hidden shadow-sm">
                    {/* Zoho Logo placeholder/styled text */}
                    <span className="text-[10px] font-bold text-red-600">ZOHO</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Zoho People API</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1 block">API Key</label>
                  <div className="relative">
                    <input
                      type={showZohoKey ? "text" : "password"}
                      value={zohoKey}
                      onChange={(e) => setZohoKey(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="Enter API Key"
                    />
                    <button
                      onClick={() => setShowZohoKey(!showZohoKey)}
                      className="absolute right-2 top-1.5 p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showZohoKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className={`flex-1 text-xs font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
                      isConnected 
                        ? 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground'
                        : 'bg-primary text-primary-foreground hover:opacity-90'
                    }`}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Connecting...
                      </>
                    ) : isConnected ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        Disconnect
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Connect
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Placeholder for future integrations */}
            <div className="p-5 bg-accent/20 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center opacity-70 group hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-muted-foreground">Add New Integration</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Connect more HR tools and platforms</p>
              <button className="mt-4 px-4 py-1.5 border border-border rounded-lg text-xs font-bold hover:bg-accent transition-colors">
                Browse Extensions
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Security Best Practices Section */}
      <motion.div
        variants={scrollVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 bg-blue-50/50 border-blue-100 shadow-sm">
            <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Encryption</h4>
            <p className="text-xs text-blue-600/80 leading-relaxed">
              All API keys are encrypted at rest using AES-256 standards. Keys are never logged in plain text.
            </p>
          </Card>
          <Card className="p-5 bg-green-50/50 border-green-100 shadow-sm">
            <h4 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Access Control</h4>
            <p className="text-xs text-green-600/80 leading-relaxed">
              Role-based access ensures only authorized CHRO personnel can manage these integrations.
            </p>
          </Card>
          <Card className="p-5 bg-amber-50/50 border-amber-100 shadow-sm">
            <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Audit Logs</h4>
            <p className="text-xs text-amber-600/80 leading-relaxed">
              Every connection attempt and modification is logged in the system's security audit trail.
            </p>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
