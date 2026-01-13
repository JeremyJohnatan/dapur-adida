"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Check } from "lucide-react";

interface AddressFormProps {
  onAddressSaved: (address: string) => void;
  initialAddress?: string;
}

export default function AddressForm({ onAddressSaved, initialAddress }: AddressFormProps) {
  const [address, setAddress] = useState(initialAddress || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialAddress) {
      setAddress(initialAddress);
      setIsSaved(true);
    }
  }, [initialAddress]);

  const handleSaveAddress = async () => {
    if (!address.trim()) {
      setError("Alamat tidak boleh kosong");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Gagal menyimpan alamat");
        return;
      }

      setIsSaved(true);
      onAddressSaved(address);
    } catch (err) {
      setError("Terjadi kesalahan saat menyimpan alamat");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <MapPin className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Alamat Pengiriman</h3>
          <p className="text-xs text-slate-500">*Wajib diisi sebelum checkout</p>
        </div>
      </div>

      <textarea
        className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none bg-slate-50 placeholder:text-slate-400 transition-all whitespace-pre-wrap break-words overflow-wrap-anywhere"
        placeholder="Contoh: Jl. Sudirman No. 123, Kelurahan Ciledug, Kecamatan Tangerang, Kota Tangerang, Banten 15117"
        rows={4}
        value={address}
        onChange={(e) => {
          setAddress(e.target.value);
          setIsSaved(false);
          setError("");
        }}
        disabled={isLoading}
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2">
          <span className="h-2 w-2 bg-red-600 rounded-full"></span>
          {error}
        </p>
      )}

      {isSaved && !error && (
        <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg flex items-center gap-2">
          <Check className="h-4 w-4" />
          Alamat sudah tersimpan
        </p>
      )}

      <Button
        onClick={handleSaveAddress}
        disabled={isLoading || !address.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Menyimpan...
          </>
        ) : isSaved ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Alamat Tersimpan
          </>
        ) : (
          <>
            <MapPin className="h-4 w-4 mr-2" />
            Simpan Alamat
          </>
        )}
      </Button>
    </div>
  );
}
