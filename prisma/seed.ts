import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt'; // Import bcrypt untuk hash password

const prisma = new PrismaClient();

async function main() {
  // --- 1. SEED MENU (Data Lama) ---
  
  // Hapus data menu lama agar bersih (Opsional, hati-hati jika production)
  await prisma.menu.deleteMany();

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

  console.log('🍽️ Mulai mengisi data menu...');

  for (const menu of menus) {
    await prisma.menu.create({
      data: menu,
    });
  }
  console.log('✅ Sukses mengisi database dengan Menu!');


  // --- 2. SEED ADMIN USER (Baru) ---
  
  console.log('👤 Membuat akun Admin...');
  
  const hashedPassword = await hash('123', 10);

  // Pakai upsert: Jika admin sudah ada, dia tidak akan bikin baru (biar gak error unique constraint)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' }, // Cek berdasarkan username unique
    update: {}, // Tidak ada yg diupdate jika sudah ada
    create: {
      fullName: 'Super Admin Dapur Adida',
      username: 'admin',
      email: 'admin@dapuradida.com',
      password: hashedPassword,
      role: 'ADMIN', // SET ROLE ADMIN DISINI
      phoneNumber: '081234567890',
      address: 'Kantor Pusat Dapur Adida, Jakarta',
    },
  });

  console.log(`✅ Sukses membuat Admin: ${admin.username} (Password: 123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });