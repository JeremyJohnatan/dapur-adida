"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, ChefHat, ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";

// Tipe Data
interface ChatMessage {
  id: string;
  message: string;
  senderId: string;
  sentAt: string;
  sender: { fullName: string };
}

interface InboxItem {
  userId: string;
  name: string;
  lastMessage: string;
  lastTime: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State Umum
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State Khusus Admin
  const [inboxList, setInboxList] = useState<InboxItem[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null); // Siapa yg sedang dichat admin

  // Cek Login
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // --- LOGIKA POLLING (Auto Update) ---
  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      const role = session.user?.role;

      if (role === "CUSTOMER") {
        // Customer: Ambil chat sendiri
        const res = await fetch("/api/chat");
        if (res.ok) setMessages(await res.json());
        setLoading(false);
      } 
      else if (role === "ADMIN") {
        // Admin: Ambil List Inbox
        const resInbox = await fetch("/api/chat?mode=inbox");
        if (resInbox.ok) setInboxList(await resInbox.json());

        // Admin: Jika sedang buka chat seseorang, update pesannya
        if (selectedPartnerId) {
          const resChat = await fetch(`/api/chat?userId=${selectedPartnerId}`);
          if (resChat.ok) setMessages(await resChat.json());
        }
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); // Refresh tiap 3 detik
    return () => clearInterval(interval);
  }, [session, selectedPartnerId]);

  // Auto scroll ke bawah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- FUNGSI KIRIM PESAN ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempMessage = newMessage;
    setNewMessage(""); 

    const payload: any = { message: tempMessage };
    
    // Jika Admin, harus sertakan ID tujuan
    if (session?.user?.role === "ADMIN") {
      if (!selectedPartnerId) return alert("Pilih user dulu!");
      payload.targetUserId = selectedPartnerId;
    }

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // State akan terupdate otomatis oleh polling
    } catch (error) {
      console.error("Gagal kirim:", error);
      setNewMessage(tempMessage);
    }
  };

  // --- RENDER LOADING ---
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="animate-pulse text-slate-500">Memuat percakapan...</p>
      </div>
    );
  }

  const isAdmin = session?.user?.role === "ADMIN";

  // --- RENDER TAMPILAN ADMIN ---
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        {/* SIDEBAR INBOX (Kiri) */}
        <div className="w-1/3 border-r bg-white flex flex-col">
          <div className="p-4 border-b bg-primary text-white">
            <h1 className="font-bold text-lg">Inbox Pesanan</h1>
            <p className="text-xs opacity-80">Halo, Admin {session.user?.name}</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {inboxList.length === 0 ? (
              <p className="text-center text-slate-400 p-4 text-sm">Belum ada pesan masuk.</p>
            ) : (
              inboxList.map((item) => (
                <div 
                  key={item.userId}
                  onClick={() => setSelectedPartnerId(item.userId)}
                  className={`p-4 border-b cursor-pointer hover:bg-slate-50 transition-colors ${selectedPartnerId === item.userId ? "bg-slate-100 border-l-4 border-l-primary" : ""}`}
                >
                  <div className="flex justify-between mb-1">
                    <h3 className="font-bold text-slate-800">{item.name}</h3>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.lastTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 truncate">{item.lastMessage}</p>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t">
            <Link href="/">
              <Button variant="outline" className="w-full">Kembali ke Home</Button>
            </Link>
          </div>
        </div>

        {/* CHAT ROOM (Kanan) */}
        <div className="flex-1 flex flex-col bg-slate-50">
          {selectedPartnerId ? (
            <>
              {/* Header Chat Room */}
              <div className="p-4 bg-white border-b flex items-center gap-3 shadow-sm">
                <div className="bg-primary/10 p-2 rounded-full">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">
                    {inboxList.find(i => i.userId === selectedPartnerId)?.name || "Pelanggan"}
                  </h2>
                  <p className="text-xs text-green-600">Sedang Chat</p>
                </div>
              </div>

              {/* Isi Chat */}
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
                {messages.map((msg) => {
                  const isMe = msg.senderId === session.user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${isMe ? "bg-primary text-white rounded-br-none" : "bg-white border text-slate-800 rounded-bl-none"}`}>
                        <p>{msg.message}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? "text-white/70" : "text-slate-400"}`}>
                          {new Date(msg.sentAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Kirim */}
              <div className="p-4 bg-white border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                    placeholder="Balas pesan..."
                    className="rounded-full"
                  />
                  <Button type="submit" size="icon" className="rounded-full bg-primary hover:bg-primary/90">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
              <p>Pilih percakapan di sebelah kiri untuk mulai membalas.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER TAMPILAN CUSTOMER (Tetap Simpel) ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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

      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 pb-24">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-10">
            <p>Mulai chat dengan Admin!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === session?.user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe ? "bg-primary text-white rounded-br-none" : "bg-white border text-slate-800 rounded-bl-none"}`}>
                <p>{msg.message}</p>
                <p className={`text-[10px] mt-1 text-right ${isMe ? "text-white/70" : "text-slate-400"}`}>
                  {new Date(msg.sentAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t p-4 fixed bottom-0 w-full">
        <form onSubmit={handleSendMessage} className="flex gap-2 container mx-auto max-w-3xl">
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tulis pesan..." 
            className="flex-1 rounded-full"
          />
          <Button type="submit" size="icon" className="rounded-full bg-primary hover:bg-primary/90">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}