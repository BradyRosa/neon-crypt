"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

interface ChatHeaderProps {
  isConnected: boolean;
  onConnect?: () => void;
}

export const ChatHeader = ({ isConnected: _isConnected, onConnect: _onConnect }: ChatHeaderProps) => {
  // Props reserved for future use (network status indicators, manual connect trigger)
  void _isConnected;
  void _onConnect;
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg">
            <svg
              className="w-6 h-6 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              NeonCrypt
            </h1>
            <p className="text-xs text-muted-foreground">FHE-powered encrypted messaging</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="shadow-md hover:shadow-lg transition-all rounded-md">
            <ConnectButton
              label="Connect Wallet"
              accountStatus="avatar"
              chainStatus="full"
              showBalance={false}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

