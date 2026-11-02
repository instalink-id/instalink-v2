export type InternetPlan = {
  id?: string;
  name: string;
  speed: string;
  price?: string;
  description: string;
  benefits?: string[];
  status?: "draft" | "available" | "unavailable";
  featured?: boolean;
};

export const homePlans: InternetPlan[] = [
  { id: "instahome-20", name: "InstaHome 20", speed: "20 Mbps", description: "Untuk kebutuhan digital harian.", benefits: ["Koneksi fiber optik", "Dukungan tim lokal"], status: "draft" },
  { id: "instahome-50", name: "InstaHome 50", speed: "50 Mbps", description: "Pilihan seimbang untuk keluarga.", benefits: ["Koneksi fiber optik", "Dukungan tim lokal"], status: "draft", featured: true },
  { id: "instahome-100", name: "InstaHome 100", speed: "100 Mbps", description: "Kapasitas lebih lega untuk rumah.", benefits: ["Koneksi fiber optik", "Dukungan tim lokal"], status: "draft" },
];
