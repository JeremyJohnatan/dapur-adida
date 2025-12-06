"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, ChefHat, ArrowLeft, MessageSquare, Loader2 } from "lucide-react";
import Link from "next/link";
import { pusherClient } from "@/lib/pusher"; // Pastikan file lib/pusher.ts sudah ada

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
  unread?: boolean;
}

export default function ChatInterface() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Admin State
  const [inboxList, setInboxList] = useState<InboxItem[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "ADMIN";

  // Redirect jika belum login
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // --- 1. FETCH DATA AWAL (Hanya Sekali saat Load) ---
  useEffect(() => {
    if (!session?.user) return;

    const fetchInitialData = async () => {
      try {
        if (isAdmin) {
          const resInbox = await fetch("/api/chat?mode=inbox");
          if (resInbox.ok) setInboxList(await resInbox.json());
        } else {
          // Customer langsung load chat roomnya
          const res = await fetch("/api/chat");
          if (res.ok) setMessages(await res.json());
        }
      } catch (err) {
        console.error("Gagal load chat:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [session, isAdmin]);

  // --- 2. FETCH DETAIL CHAT SAAT GANTI ROOM (Khusus Admin) ---
  useEffect(() => {
    if (isAdmin && selectedPartnerId) {
      setLoading(true);
      const fetchRoom = async () => {
        try {
          const res = await fetch(`/api/chat?userId=${selectedPartnerId}`);
          if (res.ok) setMessages(await res.json());
        } finally {
          setLoading(false);
        }
      };
      fetchRoom();
    }
  }, [selectedPartnerId, isAdmin]);

  // --- 3. PUSHER LISTENER (JANTUNG REALTIME) ---
  useEffect(() => {
    if (!session?.user) return;

    // Tentukan Channel ID mana yang harus didengar
    const activeChannelId = isAdmin ? selectedPartnerId : session.user.id;
    
    if (activeChannelId) {
      const channelName = `chat-${activeChannelId}`;
      const channel = pusherClient.subscribe(channelName);

      // Saat ada pesan baru masuk via Pusher
      channel.bind("new-message", (newChat: ChatMessage) => {
        setMessages((prev) => {
          // Cek biar gak duplikat
          if (prev.some(msg => msg.id === newChat.id)) return prev;
          return [...prev, newChat];
        });
        
        // Auto scroll ke bawah
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });

      return () => {
        channel.unbind_all();
        pusherClient.unsubscribe(channelName);
      };
    }
  }, [session, selectedPartnerId, isAdmin]);

  // --- 4. PUSHER KHUSUS INBOX ADMIN (Update List Kiri) ---
  useEffect(() => {
    if (isAdmin) {
      const channel = pusherClient.subscribe("admin-channel");
      
      channel.bind("new-inbox", (data: any) => {
        setInboxList((prev) => {
          // Hapus data lama user ini, taruh data baru di paling atas (Top)
          const filtered = prev.filter(item => item.userId !== data.userId);
          return [{
            userId: data.userId,
            name: data.name,
            lastMessage: data.lastMessage,
            lastTime: data.lastTime,
            unread: true
          }, ...filtered];
        });
      });

      return () => {
        channel.unbind_all();
        pusherClient.unsubscribe("admin-channel");
      };
    }
  }, [isAdmin]);

  // Auto scroll saat pertama load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  // Kirim Pesan
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempMessage = newMessage;
    setNewMessage(""); // Langsung kosongkan input biar terasa cepat

    // Siapkan Payload
    const payload: any = { message: tempMessage };
    if (isAdmin) {
      if (!selectedPartnerId) return;
      payload.targetUserId = selectedPartnerId;
    }

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Gagal kirim:", error);
      alert("Gagal mengirim pesan, cek koneksi internet.");
      setNewMessage(tempMessage); // Balikin teks kalau gagal
    }
  };

  if (status === "loading") return <div className="p-10 text-center animate-pulse">Menyiapkan chat...</div>;

  // --- RENDER ADMIN UI ---
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row h-screen">
        {/* Sidebar Inbox */}
        <div className="w-full md:w-1/3 border-r bg-white flex flex-col h-[40vh] md:h-full">
          <div className="p-4 border-b bg-primary text-white flex justify-between items-center">
            <h1 className="font-bold text-lg">Inbox Live</h1>
            <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full">Pusher Active</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {inboxList.length === 0 ? (
              <p className="text-center text-slate-400 p-8 text-sm">Belum ada pesan masuk.</p>
            ) : (
              inboxList.map((item) => (
                <div 
                  key={item.userId}
                  onClick={() => setSelectedPartnerId(item.userId)}
                  className={`p-4 border-b cursor-pointer hover:bg-slate-50 transition-colors ${selectedPartnerId === item.userId ? "bg-slate-100 border-l-4 border-l-primary" : ""}`}
                >
                  <div className="flex justify-between mb-1">
                    <h3 className={`font-bold ${item.unread ? 'text-primary' : 'text-slate-800'}`}>{item.name}</h3>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.lastTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${item.unread ? 'font-bold text-slate-800' : 'text-slate-500'}`}>{item.lastMessage}</p>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t">
            <Link href="/"><Button variant="outline" className="w-full">Home</Button></Link>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-100 h-[60vh] md:h-full">
          {selectedPartnerId ? (
            <>
              <div className="p-4 bg-white border-b flex items-center gap-3 shadow-sm">
                <div className="bg-primary/10 p-2 rounded-full"><User className="h-5 w-5 text-primary" /></div>
                <div>
                  <h2 className="font-bold text-slate-800">
                    {inboxList.find(i => i.userId === selectedPartnerId)?.name || "Pelanggan"}
                  </h2>
                  <p className="text-xs text-green-600 flex items-center gap-1">● Live Chat</p>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
                {loading ? (
                  <div className="flex justify-center mt-10"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.senderId === session?.user?.id ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${msg.senderId === session?.user?.id ? "bg-primary text-white rounded-br-none" : "bg-white border text-slate-800 rounded-bl-none"}`}>
                        <p>{msg.message}</p>
                        <p className={`text-[9px] mt-1 text-right ${msg.senderId === session?.user?.id ? "text-white/70" : "text-slate-400"}`}>
                          {new Date(msg.sentAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Balas pesan..." className="rounded-full bg-slate-50" />
                  <Button type="submit" size="icon" className="rounded-full bg-primary hover:bg-primary/90"><Send className="h-4 w-4" /></Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
              <p>Pilih percakapan di sebelah kiri.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER CUSTOMER UI ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b p-4 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <Link href="/" className="text-slate-500 hover:bg-slate-100 p-2 rounded-full"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="bg-primary/10 p-2 rounded-full"><ChefHat className="h-6 w-6 text-primary" /></div>
        <div>
          <h1 className="font-bold text-lg text-slate-800">Admin Dapur Adida</h1>
          <p className="text-xs text-green-600 flex items-center gap-1">● Online (Realtime)</p>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 pb-24">
        {loading ? (
          <div className="flex justify-center mt-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-400 mt-20">
            <p className="text-sm">Halo! Ada yang bisa kami bantu?</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === session?.user?.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${msg.senderId === session?.user?.id ? "bg-primary text-white rounded-br-none" : "bg-white border text-slate-800 rounded-bl-none"}`}>
                <p>{msg.message}</p>
                <p className={`text-[9px] mt-1 text-right ${msg.senderId === session?.user?.id ? "text-white/70" : "text-slate-400"}`}>
                  {new Date(msg.sentAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t p-4 fixed bottom-0 w-full shadow-lg">
        <form onSubmit={handleSendMessage} className="flex gap-2 container mx-auto max-w-3xl">
          <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Tulis pesan..." className="rounded-full bg-slate-50" />
          <Button type="submit" size="icon" className="rounded-full bg-primary hover:bg-primary/90"><Send className="h-4 w-4" /></Button>
        </form>
      </div>
    </div>
  );
}