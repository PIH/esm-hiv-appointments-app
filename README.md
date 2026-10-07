# esm-hiv-appointments-app

O3 frontend module for site teams to follow up HIV clinical appointments and ARV pickups:
daily and overdue lists per site, status tiles, phone numbers, contact notes and rescheduling.
Requires the `hivappointments` backend module. Page: `${openmrsSpaBase}/hiv-appointments`.

## Development (Node 20+)

    yarn install
    yarn start --backend http://localhost:8080 --port 8081

Then open http://localhost:8081/openmrs/spa/hiv-appointments (port 8080 is taken by the backend).

    yarn verify   # lint, typescript, tests
    yarn build

## Configuration

See `src/config-schema.ts`: site location tag, patient chart URL (defaults to the 2.x clinician dashboard),
page size, refresh interval, overdue lookback.
