import React from 'react';
import { Tag } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { AppointmentCategory, AppointmentStatus } from '../types';

type TagType = 'blue' | 'green' | 'teal' | 'purple' | 'magenta' | 'red';

const statusTagTypes: Record<AppointmentStatus, TagType> = {
  UPCOMING: 'blue',
  HONORED: 'green',
  HONORED_LATE: 'teal',
  RESCHEDULED: 'purple',
  MISSED: 'magenta',
  LTFU: 'red',
};

export function getStatusLabel(t: TFunction, status: AppointmentStatus) {
  switch (status) {
    case 'UPCOMING':
      return t('statusUpcoming', 'Upcoming');
    case 'HONORED':
      return t('statusHonored', 'Honored');
    case 'HONORED_LATE':
      return t('statusHonoredLate', 'Honored late');
    case 'RESCHEDULED':
      return t('statusRescheduled', 'Rescheduled');
    case 'MISSED':
      return t('statusMissed', 'Missed');
    case 'LTFU':
      return t('statusLtfu', 'Lost to follow-up');
  }
}

export function getCategoryLabel(t: TFunction, category: AppointmentCategory) {
  return category === 'CLINICAL' ? t('categoryClinical', 'Clinical visit') : t('categoryArvPickup', 'ARV pickup');
}

export const StatusTag: React.FC<{ status: AppointmentStatus }> = ({ status }) => {
  const { t } = useTranslation();
  return (
    <Tag type={statusTagTypes[status]} size="sm">
      {getStatusLabel(t, status)}
    </Tag>
  );
};
