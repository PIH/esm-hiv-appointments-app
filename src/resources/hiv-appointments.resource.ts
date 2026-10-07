import useSWR, { useSWRConfig } from 'swr';
import { useCallback } from 'react';
import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import type {
  AppointmentFilters,
  HivAppointmentsBackendConfig,
  HivAppointmentsResponse,
  TrackingPayload,
} from '../types';

const hivAppointmentsUrl = `${restBaseUrl}/hivappointments`;

export function buildAppointmentsUrl(filters: AppointmentFilters) {
  const params = new URLSearchParams({
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    startIndex: String(filters.startIndex),
    limit: String(filters.limit),
  });
  if (filters.location) {
    params.set('location', filters.location);
  }
  if (filters.category) {
    params.set('category', filters.category);
  }
  if (filters.statuses.length) {
    params.set('status', filters.statuses.join(','));
  }
  if (filters.query.trim()) {
    params.set('q', filters.query.trim());
  }
  return `${hivAppointmentsUrl}?${params.toString()}`;
}

export function useHivAppointments(filters: AppointmentFilters, refreshIntervalSeconds: number) {
  const { data, error, isLoading, isValidating } = useSWR<{ data: HivAppointmentsResponse }, Error>(
    buildAppointmentsUrl(filters),
    openmrsFetch,
    { refreshInterval: refreshIntervalSeconds * 1000, keepPreviousData: true },
  );

  return {
    appointments: data?.data?.results ?? [],
    totalCount: data?.data?.totalCount ?? 0,
    countsByStatus: data?.data?.countsByStatus,
    countsByCategory: data?.data?.countsByCategory,
    error,
    isLoading,
    isValidating,
  };
}

/**
 * Revalidates every appointment list, whatever its filters, after a tracking action
 */
export function useRevalidateHivAppointments() {
  const { mutate } = useSWRConfig();
  return useCallback(
    () => mutate((key) => typeof key === 'string' && key.startsWith(`${hivAppointmentsUrl}?`)),
    [mutate],
  );
}

export function useHivAppointmentsBackendConfig() {
  const { data, error, isLoading } = useSWR<{ data: HivAppointmentsBackendConfig }, Error>(
    `${hivAppointmentsUrl}/config`,
    openmrsFetch,
  );
  return { backendConfig: data?.data, error, isLoading };
}

export interface SiteLocation {
  uuid: string;
  display: string;
}

export function useSiteLocations(tag: string) {
  const url = `${restBaseUrl}/location?tag=${encodeURIComponent(tag)}&v=custom:(uuid,display)`;
  const { data, error, isLoading } = useSWR<{ data: { results: Array<SiteLocation> } }, Error>(
    tag ? url : null,
    openmrsFetch,
  );
  const locations = [...(data?.data?.results ?? [])].sort((a, b) => a.display.localeCompare(b.display));
  return { locations, error, isLoading };
}

export function recordTracking(payload: TrackingPayload, abortController?: AbortController) {
  return openmrsFetch<{ encounter: string; encounterDatetime: string }>(`${hivAppointmentsUrl}/tracking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    signal: abortController?.signal,
  });
}
