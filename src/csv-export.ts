import type { TFunction } from 'i18next';
import { openmrsFetch } from '@openmrs/esm-framework';
import { buildAppointmentsUrl } from './resources/hiv-appointments.resource';
import { getCategoryLabel, getStatusLabel } from './components/status-tag.component';
import type { AppointmentFilters, HivAppointment, HivAppointmentsResponse } from './types';

/** Largest page the backend returns */
const EXPORT_PAGE_SIZE = 500;

/**
 * Loads every appointment matching the filters, ignoring the page being displayed
 */
export async function fetchAllAppointments(filters: AppointmentFilters): Promise<Array<HivAppointment>> {
  const all: Array<HivAppointment> = [];
  let totalCount = Infinity;
  while (all.length < totalCount) {
    const url = buildAppointmentsUrl({ ...filters, startIndex: all.length, limit: EXPORT_PAGE_SIZE });
    const { data } = await openmrsFetch<HivAppointmentsResponse>(url);
    all.push(...data.results);
    totalCount = data.totalCount;
    if (!data.results.length) {
      break;
    }
  }
  return all;
}

/**
 * Builds a CSV document (without BOM). Dates are kept as yyyy-MM-dd so spreadsheets sort them correctly.
 */
export function buildAppointmentsCsv(appointments: Array<HivAppointment>, t: TFunction, delimiter: string): string {
  const header = [
    t('scheduledDate', 'Scheduled date'),
    t('patient', 'Patient'),
    t('identifier', 'Identifier'),
    t('age', 'Age'),
    t('sex', 'Sex'),
    t('phoneNumber', 'Phone number'),
    t('type', 'Type'),
    t('status', 'Status'),
    t('daysLateColumn', 'Days late'),
    t('site', 'Site'),
    t('visitDate', 'Visit date'),
    t('lastFollowUp', 'Last follow-up'),
    t('lastFollowUpBy', 'Follow-up by'),
    t('lastFollowUpComment', 'Follow-up comment'),
  ];

  const rows = appointments.map((a) => [
    a.scheduledDate,
    a.patient.name,
    a.patient.identifier,
    a.patient.age,
    a.patient.gender,
    a.patient.phoneNumber,
    getCategoryLabel(t, a.category),
    getStatusLabel(t, a.status),
    a.daysLate,
    a.site.name,
    a.visitDate?.substring(0, 10),
    a.lastTracking?.date?.substring(0, 10),
    a.lastTracking?.by,
    a.lastTracking?.comment,
  ]);

  return [header, ...rows].map((row) => row.map((value) => toCsvCell(value, delimiter)).join(delimiter)).join('\r\n');
}

export function toCsvCell(value: string | number | null | undefined, delimiter: string): string {
  if (value === null || value === undefined) {
    return '';
  }
  let text = String(value);
  // Neutralize spreadsheet formulas (CSV injection), but keep phone numbers like +509 and negative numbers
  if (/^[=@\t\r]/.test(text) || /^[+-][^\d\s]/.test(text)) {
    text = `'${text}`;
  }
  if (text.includes(delimiter) || /["\r\n]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Saves the CSV with a UTF-8 BOM so that Excel shows accented characters correctly
 */
export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function getExportFilename(siteName: string, fromDate: string, toDate: string) {
  const site = siteName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `hiv-appointments_${site || 'all-sites'}_${fromDate}_${toDate}.csv`;
}
