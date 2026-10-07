import React, { useState } from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { Button, DatePicker, DatePickerInput, InlineNotification, Modal, TextArea } from '@carbon/react';
import { formatDate, parseDate, showSnackbar } from '@openmrs/esm-framework';
import { recordTracking } from '../resources/hiv-appointments.resource';
import { DATE_FORMAT, getDatePickerLocale } from '../date-range';
import type { HivAppointment } from '../types';
import { getCategoryLabel } from './status-tag.component';
import styles from './tracking-modal.scss';

interface TrackingModalProps {
  appointment: HivAppointment;
  locationUuid?: string;
  onClose: () => void;
  onSaved: () => void;
}

const TrackingModal: React.FC<TrackingModalProps> = ({ appointment, locationUuid, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = !isSubmitting && (newDate !== null || comment.trim().length > 0);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await recordTracking({
        appointment: appointment.uuid,
        newDate: newDate ? dayjs(newDate).format(DATE_FORMAT) : undefined,
        comment: comment.trim() || undefined,
        location: locationUuid || undefined,
      });
      showSnackbar({
        kind: 'success',
        title: newDate ? t('appointmentRescheduled', 'Appointment rescheduled') : t('trackingSaved', 'Follow-up saved'),
        subtitle: appointment.patient.name,
      });
      onSaved();
      onClose();
    } catch (error) {
      if (error?.response?.status === 409) {
        // A colleague acted on this appointment since the list was loaded
        setErrorMessage(
          error?.responseBody?.error?.message ??
            t('appointmentChanged', 'This appointment was updated by someone else. The list has been refreshed.'),
        );
        onSaved();
      } else {
        setErrorMessage(error?.responseBody?.error?.message ?? error?.message ?? t('saveFailed', 'Could not save'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open
      size="sm"
      modalHeading={t('appointmentFollowUp', 'Appointment follow-up')}
      modalLabel={`${appointment.patient.name} · ${getCategoryLabel(t, appointment.category)}`}
      primaryButtonText={isSubmitting ? t('saving', 'Saving...') : t('save', 'Save')}
      secondaryButtonText={t('cancel', 'Cancel')}
      primaryButtonDisabled={!canSubmit}
      onRequestSubmit={handleSubmit}
      onRequestClose={onClose}
      preventCloseOnClickOutside
    >
      <dl className={styles.summary}>
        <dt>{t('scheduledDate', 'Scheduled date')}</dt>
        <dd>{formatDate(parseDate(appointment.scheduledDate), { mode: 'standard', time: false })}</dd>
        <dt>{t('phoneNumber', 'Phone number')}</dt>
        <dd>
          {appointment.patient.phoneNumber ? (
            <a href={`tel:${appointment.patient.phoneNumber}`}>{appointment.patient.phoneNumber}</a>
          ) : (
            t('noPhoneNumber', 'No phone number recorded')
          )}
        </dd>
        {appointment.lastTracking && (
          <>
            <dt>{t('lastFollowUp', 'Last follow-up')}</dt>
            <dd>
              {formatDate(parseDate(appointment.lastTracking.date))}
              {appointment.lastTracking.by && ` · ${appointment.lastTracking.by}`}
              {appointment.lastTracking.comment && (
                <div className={styles.comment}>{appointment.lastTracking.comment}</div>
              )}
            </dd>
          </>
        )}
      </dl>

      <TextArea
        id="tracking-comment"
        labelText={t('comment', 'Comment')}
        helperText={t('commentHelper', 'Call outcome, reason for missing the visit, home visit...')}
        rows={3}
        maxCount={1000}
        enableCounter
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />

      <div className={styles.dateRow}>
        <DatePicker
          datePickerType="single"
          dateFormat="d/m/Y"
          locale={getDatePickerLocale()}
          minDate={dayjs().startOf('day').toDate()}
          value={newDate ?? ''}
          onChange={([date]) => setNewDate(date ?? null)}
        >
          <DatePickerInput
            id="tracking-new-date"
            labelText={t('newDateOptional', 'New date (optional)')}
            placeholder={t('datePlaceholder', 'dd/mm/yyyy')}
            size="md"
          />
        </DatePicker>
        {newDate && (
          <Button kind="ghost" size="sm" onClick={() => setNewDate(null)}>
            {t('clear', 'Clear')}
          </Button>
        )}
      </div>

      {errorMessage && (
        <InlineNotification
          kind="error"
          lowContrast
          hideCloseButton
          title={t('error', 'Error')}
          subtitle={errorMessage}
          className={styles.notification}
        />
      )}
    </Modal>
  );
};

export default TrackingModal;
