import React from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigurableLink } from '@openmrs/esm-framework';

const HivAppointmentsAppMenuLink: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ConfigurableLink to="${openmrsSpaBase}/hiv-appointments">
      {t('hivAppointments', 'HIV appointments')}
    </ConfigurableLink>
  );
};

export default HivAppointmentsAppMenuLink;
