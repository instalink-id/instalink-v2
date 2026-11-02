import { RegistrationStatus } from '@prisma/client';

type TransitionContext = {
  coverageConfirmed?: boolean;
  reason?: string;
};

const transitions: Record<RegistrationStatus, RegistrationStatus[]> = {
  [RegistrationStatus.BARU]: [
    RegistrationStatus.DITINDAKLANJUTI,
    RegistrationStatus.DITOLAK,
  ],
  [RegistrationStatus.DITINDAKLANJUTI]: [
    RegistrationStatus.MENUNGGU_KONFIRMASI_COVERAGE,
    RegistrationStatus.PERLU_SURVEI,
    RegistrationStatus.DISETUJUI,
    RegistrationStatus.DITOLAK,
  ],
  [RegistrationStatus.MENUNGGU_KONFIRMASI_COVERAGE]: [
    RegistrationStatus.PERLU_SURVEI,
    RegistrationStatus.DISETUJUI,
    RegistrationStatus.DITOLAK,
  ],
  [RegistrationStatus.PERLU_SURVEI]: [
    RegistrationStatus.DISETUJUI,
    RegistrationStatus.DITOLAK,
  ],
  [RegistrationStatus.DISETUJUI]: [RegistrationStatus.SELESAI],
  [RegistrationStatus.DITOLAK]: [RegistrationStatus.SELESAI],
  [RegistrationStatus.SELESAI]: [],
};

export class RegistrationStatusPolicy {
  static canTransition(
    from: RegistrationStatus,
    to: RegistrationStatus,
    context: TransitionContext,
  ) {
    if (!transitions[from].includes(to)) {
      return { allowed: false as const, reason: 'Transition tidak diizinkan' };
    }
    if (to === RegistrationStatus.DISETUJUI) {
      if (!context.coverageConfirmed) {
        return { allowed: false as const, reason: 'Coverage belum dikonfirmasi' };
      }
      if (!context.reason?.trim()) {
        return { allowed: false as const, reason: 'Alasan persetujuan wajib diisi' };
      }
    }
    return { allowed: true as const };
  }
}
