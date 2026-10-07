import React from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { appointmentStatuses, type AppointmentStatus } from '../types';
import { getStatusLabel } from './status-tag.component';
import styles from './status-summary.scss';

interface StatusSummaryProps {
  countsByStatus?: Record<AppointmentStatus, number>;
  selectedStatuses: Array<AppointmentStatus>;
  onToggleStatus: (status: AppointmentStatus) => void;
}

/**
 * One tile per status. Counts ignore the status filter, so clicking a tile filters the list without changing the tiles.
 */
const StatusSummary: React.FC<StatusSummaryProps> = ({ countsByStatus, selectedStatuses, onToggleStatus }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.tiles} role="group" aria-label={t('filterByStatus', 'Filter by status')}>
      {appointmentStatuses.map((status) => {
        const selected = selectedStatuses.includes(status);
        return (
          <button
            key={status}
            type="button"
            aria-pressed={selected}
            className={classNames(styles.tile, styles[status], { [styles.selected]: selected })}
            onClick={() => onToggleStatus(status)}
          >
            <span className={styles.label}>{getStatusLabel(t, status)}</span>
            <span className={styles.count}>{countsByStatus ? countsByStatus[status] : '–'}</span>
          </button>
        );
      })}
    </div>
  );
};

export default StatusSummary;
