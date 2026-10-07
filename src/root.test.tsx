import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getDefaultsFromConfigSchema, useConfig, userHasAccess, useSession } from '@openmrs/esm-framework';
import { configSchema } from './config-schema';
import { useHivAppointments, useSiteLocations } from './resources/hiv-appointments.resource';
import type { HivAppointment } from './types';
import { buildAppointmentsCsv, downloadCsv, fetchAllAppointments } from './csv-export';
import Root from './root.component';

vi.mock('./resources/hiv-appointments.resource', () => ({
  useHivAppointments: vi.fn(),
  useSiteLocations: vi.fn(),
  useRevalidateHivAppointments: vi.fn(() => vi.fn()),
  recordTracking: vi.fn(),
}));

vi.mock('./csv-export', () => ({
  fetchAllAppointments: vi.fn(),
  buildAppointmentsCsv: vi.fn(() => 'csv'),
  downloadCsv: vi.fn(),
  getExportFilename: vi.fn(() => 'export.csv'),
}));

const mockUseHivAppointments = vi.mocked(useHivAppointments);

// Fictitious test data only
const missedAppointment: HivAppointment = {
  uuid: 'obs-1',
  category: 'CLINICAL',
  status: 'MISSED',
  scheduledDate: '2026-09-20',
  daysLate: 4,
  visitDate: null,
  patient: {
    uuid: 'patient-1',
    name: 'Jean Test',
    identifier: 'TEST001',
    gender: 'M',
    age: 34,
    phoneNumber: '0000-0000',
  },
  site: { uuid: 'site-1', name: 'Site A' },
  sourceEncounter: { uuid: 'enc-1', encounterDatetime: '2026-08-20T10:00:00.000+0000', encounterType: 'HIV Followup' },
  lastTracking: null,
};

const honoredAppointment: HivAppointment = {
  ...missedAppointment,
  uuid: 'obs-2',
  category: 'ARV_PICKUP',
  status: 'HONORED',
  daysLate: null,
  patient: { ...missedAppointment.patient, uuid: 'patient-2', name: 'Marie Test', identifier: 'TEST002' },
};

const counts = { UPCOMING: 0, HONORED: 1, HONORED_LATE: 0, RESCHEDULED: 0, MISSED: 1, LTFU: 0 };

describe('HIV appointments page', () => {
  beforeEach(() => {
    vi.mocked(useConfig).mockReturnValue(getDefaultsFromConfigSchema(configSchema));
    vi.mocked(useSession).mockReturnValue({
      authenticated: true,
      sessionId: 'session',
      user: { uuid: 'user-1' },
      sessionLocation: { uuid: 'site-1', display: 'Site A' },
    } as ReturnType<typeof useSession>);
    vi.mocked(userHasAccess).mockReturnValue(true);
    vi.mocked(useSiteLocations).mockReturnValue({
      locations: [{ uuid: 'site-1', display: 'Site A' }],
      error: undefined,
      isLoading: false,
    });
    mockUseHivAppointments.mockReturnValue({
      appointments: [missedAppointment, honoredAppointment],
      totalCount: 2,
      countsByStatus: counts,
      countsByCategory: { CLINICAL: 1, ARV_PICKUP: 1 },
      error: undefined,
      isLoading: false,
      isValidating: false,
    });
  });

  it('lists appointments for the login site by default', () => {
    render(<Root />);

    expect(screen.getByText('Jean Test')).toBeInTheDocument();
    expect(screen.getByText('Marie Test')).toBeInTheDocument();
    expect(mockUseHivAppointments).toHaveBeenLastCalledWith(
      expect.objectContaining({ location: 'site-1', statuses: [], startIndex: 0 }),
      60,
    );
  });

  it('offers follow-up only for appointments the patient has not come to', () => {
    render(<Root />);
    expect(screen.getAllByRole('button', { name: 'Follow up' })).toHaveLength(1);
  });

  it('hides follow-up for users without the manage privilege', () => {
    vi.mocked(userHasAccess).mockReturnValue(false);
    render(<Root />);
    expect(screen.queryByRole('button', { name: 'Follow up' })).not.toBeInTheDocument();
  });

  it('filters by status when a summary tile is clicked', async () => {
    const user = userEvent.setup();
    render(<Root />);

    await user.click(screen.getByRole('button', { name: /Missed\s*1/ }));

    expect(mockUseHivAppointments).toHaveBeenLastCalledWith(expect.objectContaining({ statuses: ['MISSED'] }), 60);
  });

  it('opens the follow-up dialog', async () => {
    const user = userEvent.setup();
    render(<Root />);

    await user.click(screen.getByRole('button', { name: 'Follow up' }));

    expect(screen.getByText('Appointment follow-up')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('downloads every appointment matching the filters, not only the current page', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchAllAppointments).mockResolvedValue([missedAppointment, honoredAppointment]);
    render(<Root />);

    await user.click(screen.getByRole('button', { name: /Download CSV/ }));

    expect(fetchAllAppointments).toHaveBeenCalledWith(expect.objectContaining({ location: 'site-1', startIndex: 0 }));
    expect(buildAppointmentsCsv).toHaveBeenCalledWith([missedAppointment, honoredAppointment], expect.anything(), ',');
    expect(downloadCsv).toHaveBeenCalledWith('csv', 'export.csv');
  });
});
