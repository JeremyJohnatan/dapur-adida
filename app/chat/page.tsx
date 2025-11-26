"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, User, ChefHat, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ChatMessage {
  id: string;
  message: string;
  senderId: string;
  sentAt: string;
  sender: {
    fullName: string;
    role: string;
  };
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Untuk auto-scroll ke bawah

  // Redirect jika belum login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fungsi Scroll ke Bawah
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Fetch Pesan (Polling setiap 3 detik)
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/chat");
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Error fetching chat:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages(); // Panggil pertama kali
    
    const interval = setInterval(fetchMessages, 3000); // Ulangi tiap 3 detik
    return () => clearInterval(interval);
  }, []);

  // Auto scroll saat pesan bertambah
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 2. Kirim Pesan
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempMessage = newMessage;
    setNewMessage(""); // Kosongkan input langsung biar responsif

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: tempMessage }),
      });

      if (!res.ok) {
        alert("Gagal mengirim pesan. Pastikan ada Admin yang terdaftar.");
        setNewMessage(tempMessage); // Kembalikan pesan jika gagal
      } else {
        // Refresh pesan manual agar langsung muncul
        const savedChat = await res.json();
        // Opsional: Update state messages lokal (meski polling akan mengupdate juga)
      }
    } catch (error) {
      console.error("Gagal kirim:", error);
    }
  };

  if (status === "loading") return <p className="p-8 text-center">Memuat chat...</p>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Chat */}
      <div className="bg-white border-b p-4 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <Link href="/" className="text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="bg-primary/10 p-2 rounded-full">
          <ChefHat className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-slate-800">Admin Dapur Adida</h1>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span> Online
          </p>
        </div>
      </div>

      {/* Area Chat */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 pb-24">
        {messages.length === 0 && !loading && (
          <div className="text-center text-slate-400 mt-10">
            <p>Belum ada percakapan.</p>
            <p className="text-sm">Mulai chat untuk tanya pesanan!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === session?.user?.id;
          return (
            <div 
              key={msg.id} 
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  isMe 
                    ? "bg-primary text-white rounded-br-none" 
                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm"
                }`}
              >
                {!isMe && <p className="text-[10px] font-bold text-primary mb-1">{msg.sender.fullName}</p>}
                <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                <p className={`text-[10px] mt-1 text-right ${isMe ? "text-white/70" : "text-slate-400"}`}>
                  {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Pesan */}
      <div className="bg-white border-t p-4 fixed bottom-0 w-full">
        <form onSubmit={handleSendMessage} className="flex gap-2 container mx-auto max-w-3xl">
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tulis pesan..." 
            className="flex-1 rounded-full bg-slate-100 border-none focus-visible:ring-primary"
          />
          <Button type="submit" size="icon" className="rounded-full bg-primary hover:bg-primary/90 h-10 w-10 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}