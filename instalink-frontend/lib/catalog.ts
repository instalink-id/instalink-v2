export type InternetPlan = {
  id?: string;
  name: string;
  speed?: string;
  price?: string;
  description: string;
  benefits?: string[];
  status?: "draft" | "available" | "unavailable";
  featured?: boolean;
};

export const homePlans: InternetPlan[] = [
  { id: "instahome-option-1", name: "InstaHome — Pilihan 1", description: "Pilihan layanan rumah dari katalog resmi.", status: "draft" },
  { id: "instahome-option-2", name: "InstaHome — Pilihan 2", description: "Pilihan layanan rumah dari katalog resmi.", status: "draft", featured: true },
  { id: "instahome-option-3", name: "InstaHome — Pilihan 3", description: "Pilihan layanan rumah dari katalog resmi.", status: "draft" },
];
