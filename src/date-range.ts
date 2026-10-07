import dayjs, { type Dayjs } from 'dayjs';
import { getLocale } from '@openmrs/esm-framework';

export type DateRangePreset = 'today' | 'next7Days' | 'thisWeek' | 'thisMonth' | 'overdue' | 'custom';

export const dateRangePresets: Array<DateRangePreset> = [
  'today',
  'next7Days',
  'thisWeek',
  'thisMonth',
  'overdue',
  'custom',
];

export const DATE_FORMAT = 'YYYY-MM-DD';

export interface DateRange {
  fromDate: string;
  toDate: string;
}

/**
 * @param overdueLookbackDays how far back the overdue preset goes; it ends yesterday, since today's appointments are not missed yet
 */
export function getPresetRange(
  preset: DateRangePreset,
  overdueLookbackDays: number,
  today: Dayjs = dayjs(),
): DateRange {
  const day = today.startOf('day');
  switch (preset) {
    case 'next7Days':
      return range(day, day.add(6, 'day'));
    case 'thisWeek':
      return range(day.startOf('week'), day.endOf('week'));
    case 'thisMonth':
      return range(day.startOf('month'), day.endOf('month'));
    case 'overdue':
      return range(day.subtract(overdueLookbackDays, 'day'), day.subtract(1, 'day'));
    case 'today':
    case 'custom':
    default:
      return range(day, day);
  }
}

function range(from: Dayjs, to: Dayjs): DateRange {
  return { fromDate: from.format(DATE_FORMAT), toDate: to.format(DATE_FORMAT) };
}

/**
 * Locale for the Carbon date pickers (flatpickr). Flatpickr has no Haitian Creole locale, so ht uses French.
 */
export function getDatePickerLocale(): 'fr' | 'en' {
  const locale = getLocale() ?? '';
  return locale.startsWith('fr') || locale.startsWith('ht') ? 'fr' : 'en';
}
