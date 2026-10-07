export type AppointmentCategory = 'CLINICAL' | 'ARV_PICKUP';

export type AppointmentStatus = 'UPCOMING' | 'HONORED' | 'HONORED_LATE' | 'RESCHEDULED' | 'MISSED' | 'LTFU';

export const appointmentStatuses: Array<AppointmentStatus> = [
  'UPCOMING',
  'MISSED',
  'LTFU',
  'HONORED',
  'HONORED_LATE',
  'RESCHEDULED',
];

/** Statuses a site team can act on: the patient has not come and the appointment has not been rescheduled */
export const actionableStatuses: Array<AppointmentStatus> = ['UPCOMING', 'MISSED', 'LTFU'];

export interface HivAppointment {
  /** uuid of the return visit date obs */
  uuid: string;
  category: AppointmentCategory;
  status: AppointmentStatus;
  /** yyyy-MM-dd */
  scheduledDate: string;
  daysLate: number | null;
  visitDate: string | null;
  patient: {
    uuid: string;
    name: string;
    identifier: string | null;
    gender: string;
    age: number | null;
    phoneNumber: string | null;
  };
  site: {
    uuid: string | null;
    name: string | null;
  };
  sourceEncounter: {
    uuid: string;
    encounterDatetime: string;
    encounterType: string;
  };
  lastTracking: {
    date: string;
    by: string | null;
    comment: string | null;
  } | null;
}

export interface HivAppointmentsResponse {
  results: Array<HivAppointment>;
  totalCount: number;
  startIndex: number;
  limit: number;
  countsByStatus: Record<AppointmentStatus, number>;
  countsByCategory: Record<AppointmentCategory, number>;
}

export interface HivAppointmentsBackendConfig {
  ltfuThresholdDays: number;
  maxSearchRangeDays: number;
  trackingEncounterTypes: Record<AppointmentCategory, string>;
  viewPrivilege: string;
  managePrivilege: string;
}

export interface AppointmentFilters {
  location: string;
  category: AppointmentCategory | '';
  /** yyyy-MM-dd */
  fromDate: string;
  /** yyyy-MM-dd */
  toDate: string;
  statuses: Array<AppointmentStatus>;
  query: string;
  startIndex: number;
  limit: number;
}

export interface TrackingPayload {
  appointment: string;
  /** yyyy-MM-dd */
  newDate?: string;
  comment?: string;
  location?: string;
}
