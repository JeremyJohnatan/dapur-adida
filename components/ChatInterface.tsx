"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Send, ChefHat, ArrowLeft, Loader2, MessageSquare, Search, User } from "lucide-react";
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

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;
  }

  if (session?.user?.role === "ADMIN") {
    return <AdminChatView session={session} />;
  }

  return <CustomerChatView session={session} />;
}

function AdminChatView({ session }: { session: any }) {
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(""); 
  const [inboxList, setInboxList] = useState<InboxItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userIdFromUrl = searchParams.get("userId");
    if (userIdFromUrl) {
      setSelectedPartnerId(userIdFromUrl);
    }
  }, [searchParams]);

  // 1. Fetch Inbox Awal
  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const res = await fetch("/api/chat?mode=inbox");
        if (res.ok) setInboxList(await res.json());
      } catch (err) { console.error(err); }
    };
    fetchInbox();

    const channel = pusherClient.subscribe("admin-channel");
    
    channel.bind("new-inbox", (data: any) => {
      setInboxList((prev) => {
        // Cek apakah chat yang masuk adalah chat yang sedang dibuka sekarang?
        // Jika iya, jangan set unread jadi true
        const isCurrentlyOpen = selectedPartnerId === data.userId;

        const filtered = prev.filter(item => item.userId !== data.userId);
        
        return [{
          userId: data.userId, 
          name: data.name, 
          lastMessage: data.lastMessage, 
          lastTime: new Date().toISOString(),
          // Kalau chatnya lagi dibuka, jangan kasih titik merah (false), kalau tidak dibuka kasih (true)
          unread: isCurrentlyOpen ? false : true 
        }, ...filtered];
      });
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe("admin-channel");
    };
  }, [selectedPartnerId]); // Tambahkan selectedPartnerId ke dependency biar realtime tau chat mana yg aktif

  // 2. Logic Buka Room Chat & Mark as Read
  useEffect(() => {
    if (!selectedPartnerId) return;

    setLoadingMsg(true);
    
    // A. Update Tampilan Lokal (Biar titik merah hilang seketika)
    setInboxList((prev) => prev.map(item => 
      item.userId === selectedPartnerId ? { ...item, unread: false } : item
    ));

    // B. PENTING: Beritahu Server/Database bahwa pesan sudah dibaca!
    // Kamu PERLU memastikan backend (API) kamu menangani request PATCH/POST ini.
    fetch(`/api/chat/read`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedPartnerId })
    }).catch(err => console.error("Gagal update status read", err));

    // C. Ambil pesan
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/chat?userId=${selectedPartnerId}`);
        if (res.ok) setMessages(await res.json());
      } finally {
        setLoadingMsg(false);
      }
    };
    fetchRoom();

    const channelName = `chat-${selectedPartnerId}`;
    const channel = pusherClient.subscribe(channelName);
    
    channel.bind("new-message", (newChat: ChatMessage) => {
      setMessages((prev) => {
        // Cek duplikasi ID (Safety net)
        if (prev.some(msg => msg.id === newChat.id)) return prev;
        return [...prev, newChat];
      });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [selectedPartnerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedPartnerId) return;
    
    const tempMessage = newMessage;
    setNewMessage(""); // Kosongkan input langsung

    try {
      // PERBAIKAN DOUBLE CHAT:
      // Saya menghapus bagian "Optimistic Update" (setMessages manual).
      // Kita biarkan Pusher yang mengurus update UI saat pesan berhasil masuk server.
      // Ini sedikit lebih lambat (tergantung internet), tapi 100% anti-double.

      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: tempMessage, targetUserId: selectedPartnerId }),
      });
    } catch (error) {
      setNewMessage(tempMessage); // Kembalikan teks jika gagal
      alert("Gagal mengirim pesan");
    }
  };

  const filteredInbox = inboxList.filter((item) => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUser = inboxList.find(i => i.userId === selectedPartnerId);

  return (
    <div className="flex flex-col md:flex-row w-full h-[calc(100vh-2rem)] bg-white border rounded-lg overflow-hidden shadow-sm">
        
        {/* SIDEBAR INBOX */}
        <div className="w-full md:w-80 border-r bg-white flex flex-col">
          <div className="p-4 border-b bg-slate-50">
            <h2 className="font-bold text-slate-800 mb-2">Pesan Masuk</h2>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                placeholder="Cari nama..." 
                className="w-full pl-8 pr-3 py-2 text-sm border rounded-md bg-white focus:outline-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredInbox.length === 0 ? (
              <div className="text-center p-8 text-slate-400 text-sm">
                {searchQuery ? "Nama tidak ditemukan" : "Belum ada pesan masuk."}
              </div>
            ) : (
              filteredInbox.map((item) => (
                <div 
                  key={item.userId} 
                  onClick={() => setSelectedPartnerId(item.userId)}
                  className={`p-4 border-b cursor-pointer transition-colors hover:bg-slate-50 relative
                    ${selectedPartnerId === item.userId ? "bg-primary/5 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"}`}
                >
                  {/* Titik Merah hanya muncul jika unread true DAN bukan user yg sedang dibuka */}
                  {item.unread && selectedPartnerId !== item.userId && (
                    <span className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
                  )}

                  <div className="flex justify-between items-start mb-1 pr-4">
                    <span className={`font-semibold text-sm truncate ${item.unread ? "text-slate-900 font-bold" : "text-slate-600"}`}>
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

        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col bg-slate-50 relative">
          {selectedPartnerId ? (
            <>
              {/* HEADER CHAT */}
              <div className="p-4 bg-white border-b flex items-center justify-between shadow-sm z-10 flex-none">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {selectedUser?.name.charAt(0) || <User className="w-5 h-5"/>}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">
                      {selectedUser?.name || "Pelanggan"}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="block w-2 h-2 rounded-full bg-green-500"></span>
                      <span className="text-xs text-slate-500">Online Chat</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MESSAGES LIST */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-3">
                {loadingMsg ? (
                   <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-primary"/></div>
                ) : (
                   messages.map((msg, index) => (
                    <div key={msg.id || index} className={`flex ${msg.senderId === session?.user?.id ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow-sm break-all whitespace-pre-wrap
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
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* INPUT AREA */}
              <div className="p-4 bg-white border-t flex-none">
                <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-xl border focus-within:ring-1 focus-within:ring-primary transition-all">
                  <textarea 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                    onKeyDown={(e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder="Balas pesan..." 
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm resize-none max-h-32 min-h-[40px] py-2 px-1"
                    rows={1}
                  />
                  <Button onClick={handleSendMessage} size="icon" className="rounded-lg bg-primary hover:bg-primary/90 shrink-0 h-10 w-10 mb-0.5">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 select-none">
              <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium text-slate-400">Pilih pesan untuk mulai membalas</p>
            </div>
          )}
        </div>
      </div>
  );
}

function CustomerChatView({ session }: { session: any }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/chat");
        if (res.ok) setMessages(await res.json());
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    if (session?.user?.id) {
        const channelName = `chat-${session.user.id}`;
        const channel = pusherClient.subscribe(channelName);
        
        channel.bind("new-message", (newChat: ChatMessage) => {
          setMessages((prev) => {
            if (prev.some(msg => msg.id === newChat.id)) return prev;
            return [...prev, newChat];
          });
          setSendingMessage(false);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });

        return () => {
          channel.unbind_all();
          pusherClient.unsubscribe(channelName);
        };
    }
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;
    const tempMessage = newMessage;
    setNewMessage("");
    setSendingMessage(true);

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: tempMessage }),
      });
    } catch (error) {
      setNewMessage(tempMessage);
      alert("Gagal kirim pesan");
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="h-screen w-full bg-slate-200 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-md h-[95vh] md:h-[85vh] bg-white md:rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* HEADER CUSTOMER */}
        <div className="h-16 flex-none bg-white border-b flex items-center px-4 gap-3 shadow-sm z-20">
          <Link href="/" className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft className="h-5 w-5 text-slate-600" /></Link>
          <div className="p-2 bg-primary/10 rounded-full"><ChefHat className="h-5 w-5 text-primary" /></div>
          <div>
            <h1 className="font-bold text-slate-800">Admin Dapur</h1>
            <p className="text-[10px] text-green-600 flex items-center gap-1">● Online</p>
          </div>
        </div>

        {/* CHAT BODY CUSTOMER */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-3">
          {loading ? (
            <div className="mt-10 text-center"><Loader2 className="animate-spin inline text-primary" /></div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400 space-y-2">
               <MessageSquare className="w-10 h-10 opacity-20"/>
               <p className="text-sm">Halo Kak {session?.user?.name || ""}!<br/>Ada yang bisa kami bantu?</p>
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

        {/* INPUT CUSTOMER */}
        <div className="flex-none p-3 bg-white border-t z-20">
          <div className="flex gap-2 items-end">
            <textarea 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
              placeholder="Tulis pesan..." 
              disabled={sendingMessage}
              className="flex-1 rounded-2xl bg-slate-100 border-none p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none scrollbar-hide disabled:opacity-50"
              rows={1}
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
            <Button onClick={handleSendMessage} disabled={sendingMessage} size="icon" className="rounded-full bg-primary hover:bg-primary/90 shrink-0 h-11 w-11 mb-[1px] disabled:opacity-60">
              {sendingMessage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}