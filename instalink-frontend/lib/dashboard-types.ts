export const REGISTRATION_STATUSES = [
  "BARU",
  "DITINDAKLANJUTI",
  "MENUNGGU_KONFIRMASI_COVERAGE",
  "PERLU_SURVEI",
  "DISETUJUI",
  "DITOLAK",
  "SELESAI",
] as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  BARU: "Baru",
  DITINDAKLANJUTI: "Ditindaklanjuti",
  MENUNGGU_KONFIRMASI_COVERAGE: "Menunggu konfirmasi coverage",
  PERLU_SURVEI: "Perlu survei",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
  SELESAI: "Selesai",
};

export const REGISTRATION_STATUS_TRANSITIONS: Record<
  RegistrationStatus,
  RegistrationStatus[]
> = {
  BARU: ["DITINDAKLANJUTI", "DITOLAK"],
  DITINDAKLANJUTI: [
    "MENUNGGU_KONFIRMASI_COVERAGE",
    "PERLU_SURVEI",
    "DISETUJUI",
    "DITOLAK",
  ],
  MENUNGGU_KONFIRMASI_COVERAGE: [
    "PERLU_SURVEI",
    "DISETUJUI",
    "DITOLAK",
  ],
  PERLU_SURVEI: ["DISETUJUI", "DITOLAK"],
  DISETUJUI: ["SELESAI"],
  DITOLAK: ["SELESAI"],
  SELESAI: [],
};

export type CurrentUser = {
  id: string;
  email: string;
  roles: string[];
};

export type CurrentUserResponse = {
  user: CurrentUser;
};

export type RegistrationSummaryItem = {
  id: string;
  fullName: string;
  area: string | null;
  status: RegistrationStatus;
  submittedAt: string;
};

export type RegistrationSummary = {
  counts: Record<RegistrationStatus, number>;
  latest: RegistrationSummaryItem[];
};

export type RegistrationListItem = {
  id: string;
  fullName: string;
  whatsapp: string;
  area: string | null;
  status: RegistrationStatus;
  submittedAt: string;
  updatedAt: string;
};

export type RegistrationListResponse = {
  items: RegistrationListItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type RegistrationFollowUp = {
  id: string;
  note: string;
  createdAt: string;
  actorId?: string;
};

export type RegistrationDetail = {
  id: string;
  fullName: string;
  whatsapp: string;
  email: string | null;
  installationAddress: string;
  area: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  coordinatesConsent: boolean;
  requestedPlan: string | null;
  notes: string | null;
  source: string;
  communicationConsent: boolean;
  status: RegistrationStatus;
  coverageConfirmedAt: string | null;
  approvalReason: string | null;
  submittedAt: string;
  updatedAt: string;
  followUps: RegistrationFollowUp[];
};

export type RegistrationListFilters = {
  page?: number;
  pageSize?: number;
  status?: RegistrationStatus;
  area?: string;
  from?: string;
  to?: string;
};

export type RegistrationSummaryFilters = {
  area?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export type ChangeRegistrationStatusInput = {
  status: RegistrationStatus;
  coverageConfirmed?: boolean;
  reason?: string;
};

export type ApiErrorBody = {
  code?: string;
  message?: string | string[];
  requestId?: string;
};
