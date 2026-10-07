import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Pagination } from '@carbon/react';
import { Download } from '@carbon/react/icons';
import { ErrorState, showSnackbar, useConfig, useDebounce, userHasAccess, useSession } from '@openmrs/esm-framework';
import AppointmentsFilters from './components/appointments-filters.component';
import AppointmentsTable from './components/appointments-table.component';
import StatusSummary from './components/status-summary.component';
import TrackingModal from './components/tracking-modal.component';
import { HivAppointmentsHeader } from './header/hiv-appointments-header.component';
import type { Config } from './config-schema';
import { buildAppointmentsCsv, downloadCsv, fetchAllAppointments, getExportFilename } from './csv-export';
import { getPresetRange, type DateRange, type DateRangePreset } from './date-range';
import {
  useHivAppointments,
  useRevalidateHivAppointments,
  useSiteLocations,
} from './resources/hiv-appointments.resource';
import type { AppointmentCategory, AppointmentFilters, AppointmentStatus, HivAppointment } from './types';
import styles from './root.scss';

export const MANAGE_PRIVILEGE = 'Manage HIV Appointments';

const Root: React.FC = () => {
  const { t } = useTranslation();
  const config = useConfig<Config>();
  const session = useSession();
  const { locations } = useSiteLocations(config.siteLocationTag);

  // null until the user picks a site; defaults to the login location when it is one of the sites
  const [chosenLocation, setChosenLocation] = useState<string | null>(null);
  const sessionLocation = session?.sessionLocation?.uuid;
  const location = chosenLocation ?? (locations.some((l) => l.uuid === sessionLocation) ? sessionLocation : '');

  const [category, setCategory] = useState<AppointmentCategory | ''>('');
  const [preset, setPreset] = useState<DateRangePreset>('today');
  const [range, setRange] = useState<DateRange>(() => getPresetRange('today', config.overdueLookbackDays));
  const [statuses, setStatuses] = useState<Array<AppointmentStatus>>([]);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pageSize);
  const [followUp, setFollowUp] = useState<HivAppointment | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const filters: AppointmentFilters = useMemo(
    () => ({
      location,
      category,
      fromDate: range.fromDate,
      toDate: range.toDate,
      statuses,
      query: debouncedQuery,
      startIndex: (page - 1) * pageSize,
      limit: pageSize,
    }),
    [location, category, range, statuses, debouncedQuery, page, pageSize],
  );

  const { appointments, totalCount, countsByStatus, error, isLoading, isValidating } = useHivAppointments(
    filters,
    config.refreshIntervalSeconds,
  );
  const revalidate = useRevalidateHivAppointments();
  const canManage = session?.user ? userHasAccess(MANAGE_PRIVILEGE, session.user) : false;

  // Any filter change goes back to the first page
  const withFirstPage =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const handlePresetChange = (newPreset: DateRangePreset) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      setRange(getPresetRange(newPreset, config.overdueLookbackDays));
    }
    // Overdue is about patients who have not come back
    setStatuses(newPreset === 'overdue' ? ['MISSED', 'LTFU'] : []);
    setPage(1);
  };

  const toggleStatus = (status: AppointmentStatus) => {
    setStatuses((current) => (current.includes(status) ? current.filter((s) => s !== status) : [...current, status]));
    setPage(1);
  };

  const siteName = location ? (locations.find((l) => l.uuid === location)?.display ?? '') : t('allSites', 'All sites');

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const all = await fetchAllAppointments(filters);
      downloadCsv(
        buildAppointmentsCsv(all, t, config.csvDelimiter),
        getExportFilename(siteName, filters.fromDate, filters.toDate),
      );
    } catch (exportError) {
      showSnackbar({
        kind: 'error',
        title: t('exportFailed', 'Could not export the list'),
        subtitle: exportError?.message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`omrs-main-content ${styles.page}`}>
      <HivAppointmentsHeader siteName={siteName} isRefreshing={isValidating && !isLoading} />
      <div className={styles.container}>
        <AppointmentsFilters
          locations={locations}
          location={location}
          onLocationChange={withFirstPage(setChosenLocation)}
          category={category}
          onCategoryChange={withFirstPage(setCategory)}
          preset={preset}
          onPresetChange={handlePresetChange}
          fromDate={range.fromDate}
          toDate={range.toDate}
          onCustomRangeChange={(fromDate, toDate) => {
            setRange({ fromDate, toDate });
            setPage(1);
          }}
          query={query}
          onQueryChange={withFirstPage(setQuery)}
        />

        {error ? (
          <ErrorState headerTitle={t('hivAppointments', 'HIV appointments')} error={error} />
        ) : (
          <>
            <StatusSummary countsByStatus={countsByStatus} selectedStatuses={statuses} onToggleStatus={toggleStatus} />

            <div className={styles.toolbar}>
              <span className={styles.resultCount}>
                {t('appointmentCount', '{{count}} appointments', { count: totalCount })}
              </span>
              <Button
                kind="tertiary"
                size="sm"
                renderIcon={Download}
                disabled={isExporting || totalCount === 0}
                onClick={handleExport}
              >
                {isExporting ? t('exporting', 'Exporting...') : t('downloadCsv', 'Download CSV')}
              </Button>
            </div>

            <AppointmentsTable
              appointments={appointments}
              isLoading={isLoading}
              patientChartUrl={config.patientChartUrl}
              canManage={canManage}
              onFollowUp={setFollowUp}
            />

            {totalCount > 0 && (
              <Pagination
                page={page}
                pageSize={pageSize}
                pageSizes={[25, 50, 100, 200]}
                totalItems={totalCount}
                onChange={({ page: newPage, pageSize: newPageSize }) => {
                  if (newPageSize !== pageSize) {
                    setPageSize(newPageSize);
                    setPage(1);
                  } else {
                    setPage(newPage);
                  }
                }}
              />
            )}
          </>
        )}

        {followUp && (
          <TrackingModal
            appointment={followUp}
            locationUuid={location || undefined}
            onClose={() => setFollowUp(null)}
            onSaved={revalidate}
          />
        )}
      </div>
    </div>
  );
};

export default Root;
