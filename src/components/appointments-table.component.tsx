import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  DataTableSkeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import { ConfigurableLink, formatDate, parseDate } from '@openmrs/esm-framework';
import { actionableStatuses, type HivAppointment } from '../types';
import { getCategoryLabel, StatusTag } from './status-tag.component';
import styles from './appointments-table.scss';

interface AppointmentsTableProps {
  appointments: Array<HivAppointment>;
  isLoading: boolean;
  patientChartUrl: string;
  canManage: boolean;
  onFollowUp: (appointment: HivAppointment) => void;
}

const AppointmentsTable: React.FC<AppointmentsTableProps> = ({
  appointments,
  isLoading,
  patientChartUrl,
  canManage,
  onFollowUp,
}) => {
  const { t } = useTranslation();

  const headers = [
    { key: 'scheduledDate', header: t('scheduledDate', 'Scheduled date') },
    { key: 'patient', header: t('patient', 'Patient') },
    { key: 'identifier', header: t('identifier', 'Identifier') },
    { key: 'ageGender', header: t('ageGender', 'Age / sex') },
    { key: 'phoneNumber', header: t('phoneNumber', 'Phone number') },
    { key: 'category', header: t('type', 'Type') },
    { key: 'status', header: t('status', 'Status') },
    { key: 'site', header: t('site', 'Site') },
    { key: 'lastTracking', header: t('lastFollowUp', 'Last follow-up') },
    { key: 'actions', header: '' },
  ];

  if (isLoading) {
    return (
      <DataTableSkeleton
        role="progressbar"
        columnCount={headers.length}
        rowCount={8}
        showHeader={false}
        showToolbar={false}
      />
    );
  }

  if (!appointments.length) {
    return <p className={styles.empty}>{t('noAppointments', 'No appointments match these filters')}</p>;
  }

  const renderCell = (a: HivAppointment, key: string) => {
    switch (key) {
      case 'scheduledDate':
        return formatDate(parseDate(a.scheduledDate), { mode: 'standard', time: false });
      case 'patient':
        return (
          <ConfigurableLink to={patientChartUrl} templateParams={{ patientUuid: a.patient.uuid }}>
            {a.patient.name}
          </ConfigurableLink>
        );
      case 'identifier':
        return a.patient.identifier ?? '—';
      case 'ageGender':
        return `${a.patient.age ?? '—'} / ${a.patient.gender ?? '—'}`;
      case 'phoneNumber':
        return a.patient.phoneNumber ? <a href={`tel:${a.patient.phoneNumber}`}>{a.patient.phoneNumber}</a> : '—';
      case 'category':
        return getCategoryLabel(t, a.category);
      case 'status':
        return (
          <div className={styles.status}>
            <StatusTag status={a.status} />
            {a.daysLate > 0 && (
              <span className={styles.daysLate}>{t('daysLate', '{{count}} days late', { count: a.daysLate })}</span>
            )}
          </div>
        );
      case 'site':
        return a.site.name ?? '—';
      case 'lastTracking':
        return a.lastTracking ? (
          <div className={styles.tracking}>
            <span>
              {formatDate(parseDate(a.lastTracking.date), { mode: 'standard', time: false })}
              {a.lastTracking.by && ` · ${a.lastTracking.by}`}
            </span>
            {a.lastTracking.comment && <span className={styles.trackingComment}>{a.lastTracking.comment}</span>}
          </div>
        ) : (
          '—'
        );
      case 'actions':
        return canManage && actionableStatuses.includes(a.status) ? (
          <Button kind="ghost" size="sm" onClick={() => onFollowUp(a)}>
            {t('followUp', 'Follow up')}
          </Button>
        ) : null;
      default:
        return null;
    }
  };

  // Rendered from the appointments prop rather than DataTable's row state, which lags one render behind when the list refreshes
  return (
    <TableContainer>
      <Table size="md" useZebraStyles aria-label={t('hivAppointments', 'HIV appointments')}>
        <TableHead>
          <TableRow>
            {headers.map((header) => (
              <TableHeader key={header.key}>{header.header}</TableHeader>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {appointments.map((appointment) => (
            <TableRow key={appointment.uuid}>
              {headers.map((header) => (
                <TableCell key={header.key}>{renderCell(appointment, header.key)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AppointmentsTable;
