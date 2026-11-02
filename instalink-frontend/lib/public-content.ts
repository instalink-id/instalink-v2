import type { FaqItem } from "../components/faq-list";
import type { ProcessStep } from "../components/process-steps";

export const publicContact = {
  email: "sindi@instalink.id",
  adminWhatsApp: "6285139514123",
  adminDisplay: "+62 851-3951-4123",
  technicianWhatsApp: "62811920800",
  technicianDisplay: "0811-920-800",
  operatingHours: "Setiap hari, 08.00–17.00 WIB",
} as const;

export const serviceAreas = [
  "Kecamatan Darmaraja",
  "Kecamatan Situraja",
  "Kecamatan Wado",
] as const;

export const installationSteps: ProcessStep[] = [
  { number: "01", title: "Cek alamat", description: "Gunakan peta indikatif atau kirim alamat pemasangan untuk pemeriksaan awal.", draft: true },
  { number: "02", title: "Konfirmasi tim", description: "Tim Instalink mengonfirmasi ketersediaan jaringan dan kebutuhan pemasangan.", draft: true },
  { number: "03", title: "Atur jadwal", description: "Jadwal kunjungan dan pemasangan disepakati bersama.", draft: true },
  { number: "04", title: "Aktifkan layanan", description: "Setelah proses selesai, tim menyampaikan langkah layanan berikutnya.", draft: true },
];

export const publicFaqs: FaqItem[] = [
  { question: "Apakah semua alamat di area layanan sudah terjangkau?", answer: "Belum tentu. Darmaraja, Situraja, dan Wado adalah wilayah layanan yang dapat diperiksa, tetapi keputusan akhir tetap berdasarkan alamat dan kondisi jaringan.", draft: true },
  { question: "Bagaimana cara mengajukan pemasangan?", answer: "Mulai dengan memeriksa alamat, lengkapi formulir, lalu lanjutkan konfirmasi melalui WhatsApp admin.", draft: true },
  { question: "Apakah harga paket sudah ditampilkan?", answer: "Harga paket akan mengikuti katalog resmi. Sampai katalog tersebut tersedia, silakan hubungi tim untuk konfirmasi paket dan harga terbaru.", draft: true },
];
