"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Send, ChefHat, ArrowLeft, Loader2, MessageSquare, Search } from "lucide-react";
import Link from "next/link";
import { pusherClient } from "@/lib/pusher";

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

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // --- 1. FETCH DATA AWAL ---
  useEffect(() => {
    if (!session?.user) return;
    const fetchInitialData = async () => {
      try {
        if (isAdmin) {
          const resInbox = await fetch("/api/chat?mode=inbox");
          if (resInbox.ok) setInboxList(await resInbox.json());
        } else {
          const res = await fetch("/api/chat");
          if (res.ok) setMessages(await res.json());
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [session, isAdmin]);

  // --- 2. FETCH DETAIL CHAT (Admin) ---
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

  // --- 3. PUSHER LISTENER ---
  useEffect(() => {
    if (!session?.user) return;
    const activeChannelId = isAdmin ? selectedPartnerId : session.user.id;
    if (activeChannelId) {
      const channelName = `chat-${activeChannelId}`;
      const channel = pusherClient.subscribe(channelName);
      channel.bind("new-message", (newChat: ChatMessage) => {
        setMessages((prev) => {
          if (prev.some(msg => msg.id === newChat.id)) return prev;
          return [...prev, newChat];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });
      return () => {
        channel.unbind_all();
        pusherClient.unsubscribe(channelName);
      };
    }
  }, [session, selectedPartnerId, isAdmin]);

  // --- 4. INBOX LISTENER (Admin) ---
  useEffect(() => {
    if (isAdmin) {
      const channel = pusherClient.subscribe("admin-channel");
      channel.bind("new-inbox", (data: any) => {
        setInboxList((prev) => {
          const filtered = prev.filter(item => item.userId !== data.userId);
          return [{
            userId: data.userId, name: data.name, lastMessage: data.lastMessage, lastTime: data.lastTime, unread: true
          }, ...filtered];
        });
      });
      return () => { channel.unbind_all(); pusherClient.unsubscribe("admin-channel"); };
    }
  }, [isAdmin]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  // --- LOGIC KIRIM PESAN & SHIFT+ENTER ---
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;
    
    const tempMessage = newMessage;
    setNewMessage(""); 

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
      setNewMessage(tempMessage); 
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (status === "loading") return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;

  // ==========================================
  // UI ADMIN (FIX: H-FULL / CALC HEIGHT)
  // ==========================================
  if (isAdmin) {
    return (
      // FIX DISINI: h-[calc(100vh-2rem)] membuat tingginya full layar dikurangi padding sedikit
      <div className="flex flex-col md:flex-row w-full h-[calc(100vh-2rem)] bg-white border rounded-lg overflow-hidden shadow-sm">
        
        {/* Sidebar Inbox List */}
        <div className="w-full md:w-80 border-r bg-white flex flex-col">
          <div className="p-4 border-b bg-slate-50">
            <h2 className="font-bold text-slate-800 mb-1">Pesan Masuk</h2>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <input placeholder="Cari pelanggan..." className="w-full pl-8 pr-3 py-2 text-sm border rounded-md bg-white focus:outline-primary" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {inboxList.length === 0 ? (
              <div className="text-center p-8 text-slate-400 text-sm">Belum ada pesan masuk.</div>
            ) : (
              inboxList.map((item) => (
                <div 
                  key={item.userId} 
                  onClick={() => setSelectedPartnerId(item.userId)}
                  className={`p-4 border-b cursor-pointer transition-colors hover:bg-slate-50 
                    ${selectedPartnerId === item.userId ? "bg-primary/5 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-semibold text-sm ${item.unread ? "text-slate-900" : "text-slate-600"}`}>
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                      {new Date(item.lastTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${item.unread ? "font-bold text-slate-800" : "text-slate-500"}`}>
                    {item.lastMessage}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area (Right Side) */}
        <div className="flex-1 flex flex-col bg-slate-50 relative">
          {selectedPartnerId ? (
            <>
              {/* Header Chat Room */}
              <div className="p-4 bg-white border-b flex items-center justify-between shadow-sm z-10 flex-none">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {inboxList.find(i => i.userId === selectedPartnerId)?.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">
                      {inboxList.find(i => i.userId === selectedPartnerId)?.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="block w-2 h-2 rounded-full bg-green-500"></span>
                      <span className="text-xs text-slate-500">Online</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderId === session?.user?.id ? "justify-end" : "justify-start"}`}>
                    {/* BUBBLE CHAT FIX: break-all & whitespace-pre-wrap */}
                    <div className={`max-w-[75%] md:max-w-[60%] px-4 py-3 rounded-2xl text-sm shadow-sm break-all whitespace-pre-wrap
                      ${msg.senderId === session?.user?.id 
                        ? "bg-primary text-white rounded-br-none" 
                        : "bg-white border text-slate-800 rounded-bl-none"}`}>
                      
                      {msg.message}
                      
                      <div className={`text-[10px] mt-1 text-right opacity-70 
                        ${msg.senderId === session?.user?.id ? "text-white" : "text-slate-400"}`}>
                        {new Date(msg.sentAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t flex-none">
                <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-xl border focus-within:ring-1 focus-within:ring-primary transition-all">
                  <textarea 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                    onKeyDown={handleKeyDown}
                    placeholder="Ketik pesan... (Shift+Enter untuk baris baru)" 
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm resize-none max-h-32 min-h-[40px] py-2 px-1"
                    rows={1}
                  />
                  <Button 
                    onClick={() => handleSendMessage()} 
                    size="icon" 
                    className="rounded-lg bg-primary hover:bg-primary/90 shrink-0 h-10 w-10 mb-0.5"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // State Kosong
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 select-none">
              <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium text-slate-400">Pilih percakapan untuk memulai</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // UI CUSTOMER
  // ==========================================
  return (
    <div className="h-screen w-full bg-slate-200 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-md h-[95vh] md:h-[85vh] bg-white md:rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="h-16 flex-none bg-white border-b flex items-center px-4 gap-3 shadow-sm z-20">
          <Link href="/" className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft className="h-5 w-5 text-slate-600" /></Link>
          <div className="p-2 bg-primary/10 rounded-full"><ChefHat className="h-5 w-5 text-primary" /></div>
          <div>
            <h1 className="font-bold text-slate-800">Admin Dapur</h1>
            <p className="text-[10px] text-green-600 flex items-center gap-1">● Online</p>
          </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-3">
          {loading ? (
            <div className="mt-10 text-center"><Loader2 className="animate-spin inline text-primary" /></div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400">
               <p>Mulai percakapan...</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderId === session?.user?.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-xl text-sm shadow-sm break-all whitespace-pre-wrap
                  ${msg.senderId === session?.user?.id ? "bg-primary text-white rounded-br-none" : "bg-white border text-slate-800 rounded-bl-none"}`}>
                  <p>{msg.message}</p>
                  <p className={`text-[9px] mt-1 text-right opacity-70 ${msg.senderId === session?.user?.id ? "text-white" : "text-slate-400"}`}>
                    {new Date(msg.sentAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Input Customer */}
        <div className="flex-none p-3 bg-white border-t z-20">
          <div className="flex gap-2 items-end">
            <textarea 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tulis pesan..." 
              className="flex-1 rounded-2xl bg-slate-100 border-none p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none scrollbar-hide"
              rows={1}
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
            <Button onClick={() => handleSendMessage()} size="icon" className="rounded-full bg-primary hover:bg-primary/90 shrink-0 h-11 w-11 mb-[1px]">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}