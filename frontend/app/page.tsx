"use client";

import { useState, useEffect } from "react";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/sonner";
import {
  useAccount,
  useChainId,
  useWriteContract,
  useReadContract,
  useWalletClient,
  usePublicClient,
} from "wagmi";
import { NEON_CRYPT_ABI, getNeonCryptAddress } from "@/lib/contracts/neonCrypt";
import { encryptUint32, decryptUint32, stringToUint32, uint32ToString } from "@/lib/fhevm";

interface Message {
  id: string;
  messageId: number;
  sender: string;
  message: string;
  timestamp: string;
  isEncrypted: boolean;
  isOwn?: boolean;
  encryptedHandle?: bigint;
  isActive?: boolean;
}

export default function Home() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get contract address for current chain
  let contractAddress: `0x${string}` | undefined;
  try {
    contractAddress = chainId ? getNeonCryptAddress(chainId) : undefined;
  } catch {
    contractAddress = undefined;
  }

  const { data: userMessageIds, refetch: refetchMessages } = useReadContract({
    address: contractAddress,
    abi: NEON_CRYPT_ABI,
    functionName: "getUserMessages",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(isConnected && address && contractAddress),
    },
  });

  useEffect(() => {
    if (!userMessageIds || !contractAddress || !address || !publicClient) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const typedMessageIds = userMessageIds as readonly bigint[];
        const loadedMessages: Message[] = [];

        for (const msgId of typedMessageIds) {
          const result = await publicClient.readContract({
            address: contractAddress,
            abi: NEON_CRYPT_ABI,
            functionName: "getMessage",
            args: [msgId],
          });
          const [encryptedContent, timestamp, sender, isActive] = result as unknown as [bigint, bigint, `0x${string}`, boolean];

          const isOwn = sender === address;
          const displaySender = isOwn ? "You" : `${sender.slice(0, 6)}...${sender.slice(-4)}`;

          loadedMessages.push({
            id: `msg-${msgId.toString()}`,
            messageId: Number(msgId),
            sender: displaySender,
            message: "Encrypted message",
            timestamp: new Date(Number(timestamp) * 1000).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isEncrypted: true,
            isOwn,
            encryptedHandle: encryptedContent,
            isActive,
          });
        }

        setMessages(loadedMessages);
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadMessages();
  }, [userMessageIds, contractAddress, address, publicClient]);

  const handleConnect = () => {};

  const handleSendMessage = async (message: string) => {
    if (!walletClient || !address || !contractAddress) {
      toast.error("Wallet not connected");
      return;
    }

    // Get the EIP-1193 provider from window.ethereum
    const provider = (window as unknown as { ethereum?: unknown }).ethereum;
    if (!provider) {
      toast.error("No wallet provider found");
      return;
    }

    try {
      toast.info("Encrypting message...");

      const messageValue = stringToUint32(message);
      const { handle, inputProof } = await encryptUint32(
        messageValue,
        provider as Parameters<typeof encryptUint32>[1],
        contractAddress,
        address
      );

      toast.info("Submitting to blockchain...");

      await writeContractAsync({
        address: contractAddress,
        abi: NEON_CRYPT_ABI,
        functionName: "submitMessage",
        args: [handle as `0x${string}`, inputProof as `0x${string}`],
      });

      toast.success("Message sent", {
        description: "Your encrypted message has been delivered",
      });

      await refetchMessages();
    } catch (error) {
      console.error("Send message error:", error);
      const description = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to send", {
        description,
      });
    }
  };

  const handleDecryptMessage = async (id: string) => {
    if (!walletClient || !address || !contractAddress) {
      toast.error("Wallet not connected");
      return;
    }

    // Get the EIP-1193 provider from window.ethereum
    const provider = (window as unknown as { ethereum?: unknown }).ethereum;
    if (!provider) {
      toast.error("No wallet provider found");
      return;
    }

    try {
      const target = messages.find((m) => m.id === id);
      if (!target?.encryptedHandle) {
        throw new Error("No encrypted data");
      }

      toast.info("Decrypting message...");

      const decryptedValue = await decryptUint32(
        target.encryptedHandle,
        provider as Parameters<typeof decryptUint32>[1],
        contractAddress,
        address
      );

      const decryptedMessage = uint32ToString(decryptedValue);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, message: decryptedMessage, isEncrypted: false } : m
        )
      );

      toast.success("Message decrypted");
    } catch (error) {
      console.error("Decrypt error:", error);
      const description = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to decrypt", {
        description,
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader isConnected={isConnected} onConnect={handleConnect} />

      <ScrollArea className="flex-1 container mx-auto px-4 py-6">
        <div className="space-y-4 max-w-4xl mx-auto">
          {isLoading && (
            <div className="text-center text-muted-foreground">Loading messages...</div>
          )}
          {!isLoading && messages.length === 0 && isConnected && contractAddress && (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg">No messages yet</p>
              <p className="text-sm">Send your first encrypted message below</p>
            </div>
          )}
          {!isLoading && !isConnected && (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg">Connect your wallet to start</p>
            </div>
          )}
          {!isLoading && isConnected && !contractAddress && (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg">Contract not deployed on this network</p>
              <p className="text-sm">Please switch to Hardhat or Sepolia network</p>
            </div>
          )}
          {messages
            .filter((m) => m.isActive !== false)
            .map((msg) => (
              <ChatMessage
                key={msg.id}
                {...msg}
                onDecrypt={msg.isEncrypted ? () => handleDecryptMessage(msg.id) : undefined}
                canDecrypt={Boolean(isConnected && walletClient)}
              />
            ))}
        </div>
      </ScrollArea>

      <ChatInput onSend={handleSendMessage} disabled={!isConnected || !contractAddress} />
    </div>
  );
}
