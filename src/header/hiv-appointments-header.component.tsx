import React from 'react';
import { useTranslation } from 'react-i18next';
import { InlineLoading } from '@carbon/react';
import { Calendar, Location } from '@carbon/react/icons';
import { AppointmentsPictogram, formatDate } from '@openmrs/esm-framework';
import styles from './hiv-appointments-header.scss';

interface HivAppointmentsHeaderProps {
  siteName: string;
  isRefreshing: boolean;
}

/**
 * Same layout as the dispensing app header (PharmacyHeader), showing the site being viewed rather than the login location
 */
export const HivAppointmentsHeader: React.FC<HivAppointmentsHeaderProps> = ({ siteName, isRefreshing }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.header}>
      <div className={styles.leftJustifiedItems}>
        <AppointmentsPictogram size={64} />
        <div className={styles.pageLabels}>
          <p>{t('hivProgram', 'HIV program')}</p>
          <p className={styles.pageName}>{t('hivAppointments', 'HIV appointments')}</p>
        </div>
      </div>
      <div className={styles.rightJustifiedItems}>
        <div className={styles.dateAndLocation}>
          {isRefreshing && (
            <InlineLoading className={styles.refreshing} description={t('refreshing', 'Refreshing...')} />
          )}
          <Location size={16} />
          <span className={styles.value}>{siteName}</span>
          <span className={styles.middot}>&middot;</span>
          <Calendar size={16} />
          <span className={styles.value}>{formatDate(new Date(), { noToday: true })}</span>
        </div>
      </div>
    </div>
  );
};
