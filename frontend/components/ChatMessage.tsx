"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ChatMessageProps {
  sender: string;
  message: string;
  timestamp: string;
  isEncrypted?: boolean;
  isOwn?: boolean;
  onDecrypt?: () => void;
  canDecrypt?: boolean;
  onDelete?: () => void;
  canDelete?: boolean;
  isDeleting?: boolean;
}

export const ChatMessage = ({
  sender,
  message,
  timestamp,
  isEncrypted = true,
  isOwn = false,
  onDecrypt,
  canDecrypt,
  onDelete,
  canDelete,
  isDeleting = false,
}: ChatMessageProps) => {
  return (
    <div
      className={`flex gap-3 p-4 rounded-lg bg-card backdrop-blur-sm border border-border hover:shadow-md transition-all animate-fade-in ${
        isOwn ? "ml-auto max-w-[80%] flex-row-reverse" : "max-w-[80%]"
      }`}
    >
      <Avatar className="w-10 h-10 border-2 border-primary/20 shadow-sm">
        <AvatarFallback
          className={`${
            isOwn ? "bg-secondary/20 text-secondary" : "bg-primary/20 text-primary"
          } font-semibold`}
        >
          {isOwn ? "ME" : sender.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-foreground">{sender}</span>
          {isEncrypted && (
            <div className="flex items-center" title="End-to-end encrypted">
              <svg
                className="w-3 h-3 text-accent"
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
          )}
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>

        <div className="text-sm text-foreground/90 break-words leading-relaxed flex items-center gap-3">
          <span>{message}</span>
          <div className="flex items-center gap-2 ml-auto">
            {isEncrypted && onDecrypt && (
              <button
                onClick={onDecrypt}
                disabled={!canDecrypt}
                className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-50 transition-colors"
                title={canDecrypt ? "Decrypt message" : "Connect and authenticate to decrypt"}
              >
                Decrypt
              </button>
            )}
            {isOwn && onDelete && (
              <button
                onClick={onDelete}
                disabled={!canDelete || isDeleting}
                className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50 transition-colors"
                title={canDelete ? "Delete message" : "Cannot delete"}
              >
                {isDeleting ? (
                  <svg
                    className="w-3 h-3 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  "Delete"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

