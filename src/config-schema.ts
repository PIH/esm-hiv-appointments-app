import { Type, validators } from '@openmrs/esm-framework';

export const configSchema = {
  siteLocationTag: {
    _type: Type.String,
    _default: 'Login Location',
    _description: 'Location tag of the sites offered in the site selector. Each site includes its child locations.',
  },
  patientChartUrl: {
    _type: Type.String,
    _default:
      '${openmrsBase}/coreapps/clinicianfacing/patient.page?patientId=${patientUuid}&app=pih.app.clinicianDashboard',
    _description:
      'Where clicking a patient name leads. Defaults to the 2.x clinician dashboard. Use ${openmrsSpaBase}/patient/${patientUuid}/chart for the O3 patient chart.',
  },
  pageSize: {
    _type: Type.Number,
    _default: 50,
    _description: 'Number of appointments per page',
    _validators: [validators.inRange(10, 500)],
  },
  refreshIntervalSeconds: {
    _type: Type.Number,
    _default: 60,
    _description:
      'How often the list is refreshed, so that the team at a site sees what colleagues have done. 0 disables refreshing.',
    _validators: [validators.inRange(0, 3600)],
  },
  overdueLookbackDays: {
    _type: Type.Number,
    _default: 90,
    _description: 'How far back the "Overdue" preset looks for missed appointments',
    _validators: [validators.inRange(1, 366)],
  },
  csvDelimiter: {
    _type: Type.String,
    _default: ',',
    _description:
      'Column separator of the CSV export. Comma is the CSV standard and matches Excel with English regional settings; use a semicolon where Excel uses French regional settings.',
    _validators: [validators.oneOf([';', ',', '	'])],
  },
};

export interface Config {
  siteLocationTag: string;
  patientChartUrl: string;
  pageSize: number;
  refreshIntervalSeconds: number;
  overdueLookbackDays: number;
  csvDelimiter: string;
}
