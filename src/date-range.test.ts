import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { getPresetRange } from './date-range';

// Thursday
const today = dayjs('2026-09-24T15:30:00');

describe('getPresetRange', () => {
  it('returns a single day for today', () => {
    expect(getPresetRange('today', 90, today)).toEqual({ fromDate: '2026-09-24', toDate: '2026-09-24' });
  });

  it('returns today and the 6 following days for next 7 days', () => {
    expect(getPresetRange('next7Days', 90, today)).toEqual({ fromDate: '2026-09-24', toDate: '2026-09-30' });
  });

  it('returns the calendar month for this month', () => {
    expect(getPresetRange('thisMonth', 90, today)).toEqual({ fromDate: '2026-09-01', toDate: '2026-09-30' });
  });

  it('ends overdue yesterday, since appointments today are not missed yet', () => {
    expect(getPresetRange('overdue', 90, today)).toEqual({ fromDate: '2026-06-26', toDate: '2026-09-23' });
  });
});
