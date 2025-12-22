"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, ChefHat, Search, ImageIcon, Star } from "lucide-react"; // Import Star
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch"; // Pastikan kamu punya component Switch ui shadcn

// --- KONFIGURASI CLOUDINARY ---
const CLOUDINARY_CLOUD_NAME = "dvntlphzd"; 
const CLOUDINARY_UPLOAD_PRESET = "dapur-adida-preset"; 

// Tipe Data Menu
interface Menu {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean; // <--- Tambahan Field
  stock: number;
}

export default function AdminMenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State Modal & Loading
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    isAvailable: true,
    isFeatured: false, // <--- Tambahan State
    stock: 0
  });

  // State File Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // --- FETCH DATA ---
  const fetchMenus = async () => {
    try {
      const res = await fetch("/api/admin/menu"); // Pastikan endpoint GET menampilkan semua data
      if (res.ok) setMenus(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  // --- HANDLER UPLOAD GAMBAR ---
  const handleImageUpload = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET); 

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      
      if (!res.ok) throw new Error("Gagal upload ke Cloudinary");

      const data = await res.json();
      setIsUploading(false);
      return data.secure_url; 
    } catch (error) {
      console.error("Gagal upload gambar:", error);
      setIsUploading(false);
      alert(`Gagal upload gambar. Cek Cloud Name.`);
      return null;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // --- CRUD HANDLERS ---
  const resetForm = () => {
    setFormData({ id: "", name: "", description: "", price: "", imageUrl: "", isAvailable: true, isFeatured: false, stock: 0 });
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsEditing(false);
  };

  const handleEdit = (menu: Menu) => {
    setFormData({
      id: menu.id,
      name: menu.name,
      description: menu.description || "",
      price: menu.price.toString(),
      imageUrl: menu.imageUrl || "",
      isAvailable: menu.isAvailable,
      isFeatured: menu.isFeatured, // Load status featured
      stock: menu.stock
    });
    setPreviewUrl(menu.imageUrl); 
    setSelectedFile(null); 
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // --- FITUR CEPAT: TOGGLE REKOMENDASI (KLIK BINTANG) ---
  const toggleFeatured = async (menu: Menu) => {
    // Optimistic Update (Ubah tampilan dulu biar cepet)
    const newStatus = !menu.isFeatured;
    setMenus(prev => prev.map(m => m.id === menu.id ? { ...m, isFeatured: newStatus } : m));

    try {
      await fetch(`/api/admin/menu/${menu.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: newStatus }),
      });
    } catch (error) {
      // Revert jika gagal
      setMenus(prev => prev.map(m => m.id === menu.id ? { ...m, isFeatured: !newStatus } : m));
      alert("Gagal update status rekomendasi");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus menu ini?")) return;
    try {
      const res = await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMenus(prev => prev.filter(m => m.id !== id));
        alert("Menu berhasil dihapus!");
      }
    } catch (error) {
      alert("Gagal menghapus menu.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSubmit(true);

    try {
      let finalImageUrl = formData.imageUrl;

      if (selectedFile) {
        const uploadedUrl = await handleImageUpload(selectedFile);
        if (!uploadedUrl) {
          setIsLoadingSubmit(false);
          return; 
        }
        finalImageUrl = uploadedUrl;
      }

      const url = isEditing ? `/api/admin/menu/${formData.id}` : "/api/admin/menu";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            ...formData, 
            price: Number(formData.price), // Konversi angka
            imageUrl: finalImageUrl 
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan");

      alert(isEditing ? "Menu diperbarui!" : "Menu ditambahkan!");
      setIsModalOpen(false);
      fetchMenus(); // Refresh data
      resetForm();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan menu.");
    } finally {
      setIsLoadingSubmit(false);
    }
  };

  const filteredMenus = menus
    .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      // Featured first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      
      // Then available with stock
      const aAvailable = a.isAvailable && a.stock > 0;
      const bAvailable = b.isAvailable && b.stock > 0;
      if (aAvailable && !bAvailable) return -1;
      if (!aAvailable && bAvailable) return 1;
      
      // Alphabetical by name
      return a.name.localeCompare(b.name);
    });
  const formatRupiah = (price: string) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(price));
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Manajemen Menu</h1>
            <p className="text-slate-500 text-sm">Klik ikon <Star className="inline h-3 w-3 text-orange-400 fill-orange-400"/> untuk mengatur Rekomendasi Spesial.</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cari menu..." 
              className="pl-9" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" /> Tambah Menu
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenus.map((menu) => (
            <Card key={menu.id} className={`overflow-hidden group hover:shadow-lg transition-all border-slate-200 ${menu.isFeatured ? 'ring-2 ring-orange-400' : ''} ${(!menu.isAvailable || menu.stock <= 0) ? 'ring-2 ring-red-400 bg-red-50' : ''}`}>
              <div className="relative h-48 bg-slate-100">
                {menu.imageUrl ? (
                  <Image src={menu.imageUrl} alt={menu.name} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-300"><ChefHat className="h-12 w-12" /></div>
                )}
                
                {/* BUTTON ACTIONS */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/90 hover:bg-white" onClick={() => handleEdit(menu)}>
                    <Pencil className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(menu.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* BUTTON TOGGLE REKOMENDASI (STAR) */}
                <button 
                    onClick={() => toggleFeatured(menu)}
                    className="absolute top-2 left-2 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm transition-all z-10"
                    title={menu.isFeatured ? "Hapus dari Rekomendasi" : "Jadikan Rekomendasi"}
                >
                    <Star className={`h-5 w-5 ${menu.isFeatured ? "text-orange-500 fill-orange-500" : "text-slate-300"}`} />
                </button>

                {(!menu.isAvailable || menu.stock <= 0) && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                    <Badge variant="destructive" className="text-lg px-6 py-2 font-bold uppercase tracking-widest shadow-lg">
                      {menu.stock <= 0 ? "Stok Habis" : "Tidak Tersedia"}
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 line-clamp-1">{menu.name}</h3>
                  <span className="font-bold text-primary text-sm">{formatRupiah(menu.price)}</span>
                </div>
                <p className="text-slate-500 text-xs line-clamp-2 h-8">{menu.description}</p>
                <div className="mt-2 text-xs text-slate-600">
                  Stok: {menu.stock > 0 ? menu.stock : <span className="text-red-600 font-bold">Habis</span>}
                </div>
                
                {menu.isFeatured && (
                    <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 w-fit px-2 py-1 rounded-full">
                        <Star className="h-3 w-3 fill-current"/> Rekomendasi Spesial
                    </div>
                )}
                {(!menu.isAvailable || menu.stock <= 0) && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 w-fit px-2 py-1 rounded-full">
                    ⚠️ Perlu Perhatian
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL FORM ADD/EDIT */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Menu" : "Tambah Menu Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Makanan</Label>
              <Input id="name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Contoh: Nasi Goreng Spesial" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Harga (Rp)</Label>
                <Input id="price" type="number" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="25000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stok</Label>
                <Input id="stock" type="number" required value={formData.stock} onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})} placeholder="10" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Ketersediaan</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.isAvailable ? "true" : "false"}
                onChange={(e) => setFormData({...formData, isAvailable: e.target.value === "true"})}
              >
                <option value="true">Tersedia</option>
                <option value="false">Habis</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Deskripsi</Label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder="Deskripsi singkat menu..."
              />
            </div>

            {/* TOGGLE REKOMENDASI DI FORM */}
            <div className="flex items-center justify-between border p-3 rounded-md bg-slate-50">
                <div className="flex items-center gap-2">
                    <Star className={`h-5 w-5 ${formData.isFeatured ? "text-orange-500 fill-orange-500" : "text-slate-400"}`} />
                    <Label htmlFor="featured" className="cursor-pointer">Rekomendasi Spesial?</Label>
                </div>
                {/* Checkbox Manual jika tidak pakai komponen Switch */}
                <input 
                    type="checkbox" 
                    id="featured"
                    className="h-5 w-5 accent-orange-500"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                />
            </div>

            {/* INPUT UPLOAD GAMBAR */}
            <div className="space-y-3">
              <Label>Foto Menu</Label>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                  {previewUrl ? (
                    <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <Input 
                    id="file-upload" 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Atau gunakan URL eksternal di bawah ini.
                  </p>
                </div>
              </div>

              <Input 
                id="imageUrl" 
                value={formData.imageUrl} 
                onChange={(e) => {
                  setFormData({...formData, imageUrl: e.target.value});
                  setPreviewUrl(e.target.value); 
                }} 
                placeholder="https://..." 
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isLoadingSubmit || isUploading} className="w-full bg-primary hover:bg-primary/90">
                {isUploading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengupload Gambar...</>
                ) : isLoadingSubmit ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                ) : (
                  "Simpan Menu"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}