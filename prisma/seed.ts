import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Hapus data lama jika ada (biar tidak duplikat saat di-run ulang)
  await prisma.menu.deleteMany();

  // Data Menu Dapur Adida
  const menus = [
    {
      name: "Ayam Bakar saja",
      description: "Ayam kampung bakar dengan olesan madu hutan asli, disajikan dengan lalapan segar dan sambal terasi.",
      price: 25000,
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
    },
    {
      name: "Paket Nasi Timbel",
      description: "Nasi timbel komplit dengan ayam goreng lengkuas, tahu, tempe, ikan asin, dan sayur asem.",
      price: 20000,
      imageUrl: "https://images.unsplash.com/photo-1563245372-f21720e32c4d?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
    },
    {
      name: "Salmon Teriyaki",
      description: "Potongan salmon segar dipanggang dengan saus teriyaki manis gurih, cocok untuk menu diet sehat.",
      price: 45000,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
    },
    {
      name: "Rendang Daging Sapi",
      description: "Daging sapi pilihan dimasak perlahan dengan rempah padang asli selama 8 jam. Empuk dan meresap.",
      price: 35000,
      imageUrl: "https://images.unsplash.com/photo-1603082303265-e219eb3b7503?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
    },
    {
      name: "Soto Betawi Susu",
      description: "Kuah soto creamy dari susu segar (tanpa santan), daging sapi, kentang, dan emping.",
      price: 28000,
      imageUrl: "https://images.unsplash.com/photo-1572656631137-7935297eff55?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
    },
    {
      name: "Es Teler Sultan",
      description: "Campuran alpukat, kelapa muda, nangka, dan susu kental manis dengan es serut.",
      price: 15000,
      imageUrl: "https://images.unsplash.com/photo-1563583999575-2d3744fb2977?q=80&w=800&auto=format&fit=crop",
      isAvailable: true,
    },
  ];

  console.log('Mulai mengisi data menu...');

  for (const menu of menus) {
    await prisma.menu.create({
      data: menu,
    });
  }

  console.log('✅ Sukses mengisi database dengan Menu!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });