export type InternetPlan = {
  name: string;
  speed: string;
  price: string;
  description: string;
  featured?: boolean;
};

export const homePlans: InternetPlan[] = [
  { name: "InstaHome 20", speed: "20 Mbps", price: "Rp150.000/bulan", description: "Untuk kebutuhan browsing, belajar, dan hiburan harian." },
  { name: "InstaHome 50", speed: "50 Mbps", price: "Rp200.000/bulan", description: "Pilihan seimbang untuk keluarga dan aktivitas digital." , featured: true },
  { name: "InstaHome 100", speed: "100 Mbps", price: "Rp300.000/bulan", description: "Kapasitas lebih lega untuk banyak perangkat di rumah." },
];

