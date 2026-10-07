import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { buildAppointmentsCsv, getExportFilename, toCsvCell } from './csv-export';
import type { HivAppointment } from './types';

const t = ((key: string, defaultValue: string) => defaultValue) as unknown as TFunction;

// Fictitious test data only
const appointment: HivAppointment = {
  uuid: 'obs-1',
  category: 'ARV_PICKUP',
  status: 'MISSED',
  scheduledDate: '2026-09-20',
  daysLate: 4,
  visitDate: null,
  patient: {
    uuid: 'p-1',
    name: 'Jean "Ti" Test',
    identifier: 'TEST001',
    gender: 'M',
    age: 34,
    phoneNumber: '+509 0000-0000',
  },
  site: { uuid: 's-1', name: 'Site A; annexe' },
  sourceEncounter: {
    uuid: 'e-1',
    encounterDatetime: '2026-08-20T10:00:00.000+0000',
    encounterType: 'HIV drug dispensing',
  },
  lastTracking: { date: '2026-09-22T09:15:00.000+0000', by: 'Agent Test', comment: 'Appelé,\npas de réponse' },
};

describe('toCsvCell', () => {
  it('quotes values containing the delimiter, quotes or line breaks', () => {
    expect(toCsvCell('a;b', ';')).toBe('"a;b"');
    expect(toCsvCell('say "hi"', ';')).toBe('"say ""hi"""');
    expect(toCsvCell('line1\nline2', ';')).toBe('"line1\nline2"');
  });

  it('neutralizes formulas but keeps phone numbers and negative numbers', () => {
    expect(toCsvCell('=HYPERLINK("x")', ';')).toBe('"\'=HYPERLINK(""x"")"');
    expect(toCsvCell('@SUM(A1)', ';')).toBe("'@SUM(A1)");
    expect(toCsvCell('+509 0000-0000', ';')).toBe('+509 0000-0000');
    expect(toCsvCell(-3, ';')).toBe('-3');
  });

  it('writes empty cells for missing values', () => {
    expect(toCsvCell(null, ';')).toBe('');
    expect(toCsvCell(undefined, ';')).toBe('');
  });
});

describe('buildAppointmentsCsv', () => {
  it('writes a header and one line per appointment', () => {
    const lines = buildAppointmentsCsv([appointment], t, ';').split('\r\n');

    expect(lines[0]).toBe(
      'Scheduled date;Patient;Identifier;Age;Sex;Phone number;Type;Status;Days late;Site;Visit date;Last follow-up;Follow-up by;Follow-up comment',
    );
    // The line break inside the comment stays in its quoted cell; rows are separated by CRLF
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe(
      '2026-09-20;"Jean ""Ti"" Test";TEST001;34;M;+509 0000-0000;ARV pickup;Missed;4;"Site A; annexe";;2026-09-22;Agent Test;"Appelé,\npas de réponse"',
    );
  });

  it('quotes names containing a comma when the delimiter is a comma', () => {
    const csv = buildAppointmentsCsv(
      [{ ...appointment, patient: { ...appointment.patient, name: 'Test, Jean' } }],
      t,
      ',',
    );
    expect(csv.split('\r\n')[1].startsWith('2026-09-20,"Test, Jean",TEST001,')).toBe(true);
  });
});

describe('getExportFilename', () => {
  it('builds a safe filename from the site and period', () => {
    expect(getExportFilename('Klinik Ekstèn', '2026-09-01', '2026-09-30')).toBe(
      'hiv-appointments_klinik-eksten_2026-09-01_2026-09-30.csv',
    );
    expect(getExportFilename('', '2026-09-01', '2026-09-30')).toBe(
      'hiv-appointments_all-sites_2026-09-01_2026-09-30.csv',
    );
  });
});
