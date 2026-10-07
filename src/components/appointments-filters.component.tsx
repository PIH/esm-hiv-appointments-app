import React from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { ComboBox, ContentSwitcher, DatePicker, DatePickerInput, Dropdown, Search, Switch } from '@carbon/react';
import { DATE_FORMAT, dateRangePresets, getDatePickerLocale, type DateRangePreset } from '../date-range';
import type { SiteLocation } from '../resources/hiv-appointments.resource';
import type { AppointmentCategory } from '../types';
import styles from './appointments-filters.scss';

interface AppointmentsFiltersProps {
  locations: Array<SiteLocation>;
  location: string;
  onLocationChange: (uuid: string) => void;
  category: AppointmentCategory | '';
  onCategoryChange: (category: AppointmentCategory | '') => void;
  preset: DateRangePreset;
  onPresetChange: (preset: DateRangePreset) => void;
  fromDate: string;
  toDate: string;
  onCustomRangeChange: (fromDate: string, toDate: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
}

const categories: Array<AppointmentCategory | ''> = ['', 'CLINICAL', 'ARV_PICKUP'];

const AppointmentsFilters: React.FC<AppointmentsFiltersProps> = ({
  locations,
  location,
  onLocationChange,
  category,
  onCategoryChange,
  preset,
  onPresetChange,
  fromDate,
  toDate,
  onCustomRangeChange,
  query,
  onQueryChange,
}) => {
  const { t } = useTranslation();

  const presetLabels: Record<DateRangePreset, string> = {
    today: t('presetToday', 'Today'),
    next7Days: t('presetNext7Days', 'Next 7 days'),
    thisWeek: t('presetThisWeek', 'This week'),
    thisMonth: t('presetThisMonth', 'This month'),
    overdue: t('presetOverdue', 'Overdue'),
    custom: t('presetCustom', 'Custom range'),
  };

  const allSites: SiteLocation = { uuid: '', display: t('allSites', 'All sites') };
  const siteItems = [allSites, ...locations];

  return (
    <div className={styles.filters}>
      <div className={styles.row}>
        <ComboBox
          id="hiv-appointments-site"
          className={styles.site}
          titleText={t('site', 'Site')}
          items={siteItems}
          itemToString={(item: SiteLocation) => item?.display ?? ''}
          selectedItem={siteItems.find((l) => l.uuid === location) ?? allSites}
          onChange={({ selectedItem }) => onLocationChange(selectedItem?.uuid ?? '')}
        />

        <Dropdown
          id="hiv-appointments-period"
          className={styles.period}
          titleText={t('period', 'Period')}
          label=""
          items={dateRangePresets}
          itemToString={(item: DateRangePreset) => (item ? presetLabels[item] : '')}
          selectedItem={preset}
          onChange={({ selectedItem }) => onPresetChange(selectedItem)}
        />

        {preset === 'custom' && (
          <DatePicker
            datePickerType="range"
            dateFormat="d/m/Y"
            locale={getDatePickerLocale()}
            value={[dayjs(fromDate).toDate(), dayjs(toDate).toDate()]}
            onChange={([from, to]) => {
              if (from && to) {
                onCustomRangeChange(dayjs(from).format(DATE_FORMAT), dayjs(to).format(DATE_FORMAT));
              }
            }}
          >
            <DatePickerInput
              id="hiv-appointments-from"
              labelText={t('from', 'From')}
              placeholder={t('datePlaceholder', 'dd/mm/yyyy')}
            />
            <DatePickerInput
              id="hiv-appointments-to"
              labelText={t('to', 'To')}
              placeholder={t('datePlaceholder', 'dd/mm/yyyy')}
            />
          </DatePicker>
        )}
      </div>

      <div className={styles.row}>
        <ContentSwitcher
          className={styles.category}
          size="md"
          selectedIndex={categories.indexOf(category)}
          onChange={({ index }) => onCategoryChange(categories[index])}
        >
          <Switch name="all" text={t('allAppointments', 'All')} />
          <Switch name="clinical" text={t('categoryClinical', 'Clinical visit')} />
          <Switch name="arv" text={t('categoryArvPickup', 'ARV pickup')} />
        </ContentSwitcher>

        <Search
          className={styles.search}
          size="md"
          labelText={t('searchPatient', 'Search by name or identifier')}
          placeholder={t('searchPatient', 'Search by name or identifier')}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onClear={() => onQueryChange('')}
        />
      </div>
    </div>
  );
};

export default AppointmentsFilters;
