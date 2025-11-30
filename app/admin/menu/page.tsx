"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, ChefHat, Search, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// --- KONFIGURASI CLOUDINARY ---
// 1. Cloud Name: Cek di Dashboard Cloudinary (biasanya nama pendek tanpa spasi)
const CLOUDINARY_CLOUD_NAME = "dvntlphzd"; 

// 2. Upload Preset: Yang baru saja kamu buat
const CLOUDINARY_UPLOAD_PRESET = "dapur-adida-preset"; 

// Tipe Data Menu
interface Menu {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  isAvailable: boolean;
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
    isAvailable: true
  });

  // State File Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // --- FETCH DATA ---
  const fetchMenus = async () => {
    try {
      const res = await fetch("/api/menus");
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

  // --- HANDLER UPLOAD GAMBAR KE CLOUDINARY ---
  const handleImageUpload = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET); 

    try {
      // Pastikan URL ini benar sesuai cloud name kamu
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
      alert(`Gagal upload gambar. Pastikan Cloud Name '${CLOUDINARY_CLOUD_NAME}' sudah benar.`);
      return null;
    }
  };

  // --- HANDLER FILE INPUT ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // --- HANDLERS FORM ---
  const resetForm = () => {
    setFormData({ id: "", name: "", description: "", price: "", imageUrl: "", isAvailable: true });
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
      isAvailable: menu.isAvailable
    });
    setPreviewUrl(menu.imageUrl); 
    setSelectedFile(null); 
    setIsEditing(true);
    setIsModalOpen(true);
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

      // 1. Upload Gambar jika ada file baru
      if (selectedFile) {
        const uploadedUrl = await handleImageUpload(selectedFile);
        if (!uploadedUrl) {
          setIsLoadingSubmit(false);
          return; 
        }
        finalImageUrl = uploadedUrl;
      }

      // 2. Simpan ke Database
      const url = isEditing ? `/api/admin/menu/${formData.id}` : "/api/admin/menu";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, imageUrl: finalImageUrl }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan");

      alert(isEditing ? "Menu diperbarui!" : "Menu ditambahkan!");
      setIsModalOpen(false);
      fetchMenus();
      resetForm();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan menu.");
    } finally {
      setIsLoadingSubmit(false);
    }
  };

  const filteredMenus = menus.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const formatRupiah = (price: string) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(price));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Manajemen Menu</h1>
        
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
            <Card key={menu.id} className="overflow-hidden group hover:shadow-lg transition-all border-slate-200">
              <div className="relative h-48 bg-slate-100">
                {menu.imageUrl ? (
                  <Image src={menu.imageUrl} alt={menu.name} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-300"><ChefHat className="h-12 w-12" /></div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/90 hover:bg-white" onClick={() => handleEdit(menu)}>
                    <Pencil className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(menu.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {!menu.isAvailable && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Badge variant="destructive">Tidak Tersedia</Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 line-clamp-1">{menu.name}</h3>
                  <span className="font-bold text-primary text-sm">{formatRupiah(menu.price)}</span>
                </div>
                <p className="text-slate-500 text-xs line-clamp-2 h-8">{menu.description}</p>
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
                    Atau gunakan URL eksternal di bawah ini jika tidak ingin upload.
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