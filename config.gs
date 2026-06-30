/**
 * Configuration for Digital Health Twin sync
 * Update these values for your setup
 */

const CONFIG = {
  // REQUIRED: Get from your Sheet URL
  // URL format: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
  
  // Your timezone for date formatting
  TIMEZONE: 'America/New_York',
  
  // How many days of historical data to sync
  LOOKBACK_DAYS: 7,
  
  // Google Fit data sources
  FIT_DATA_SOURCES: {
    weight: 'com.google.weight',
    bodyFat: 'com.google.body.fat.percentage',
    muscleMass: 'com.google.lean.body.mass',
    viscFat: 'com.google.body.fat.percentage',
    glucose: 'com.google.blood_glucose',
    ketones: 'com.google.blood_ketones',
    waist: 'com.google.body.measurements.waist_circumference',
    chest: 'com.google.body.measurements.chest_circumference',
    hip: 'com.google.body.measurements.hip_circumference',
    systolic: 'com.google.blood_pressure',
    diastolic: 'com.google.blood_pressure',
    steps: 'com.google.step_count.delta',
    sleep: 'com.google.sleep.segment',
    heartRate: 'com.google.heart_rate.bpm',
    hrv: 'com.google.heart_rate.variability'
  },
  
  // Optional: Sheet name for execution logs
  // Leave blank to disable logging sheet
  LOG_SHEET_NAME: 'Sync Logs',
  
  // Date format for sheets
  DATE_FORMAT: 'MM/dd/yyyy',
  TIME_FORMAT: 'HH:mm:ss'
};

/**
 * Metric to Sheet Tab mapping
 * Maps Google Fit metric types to sheet tabs and columns
 */
const METRIC_MAPPING = {
  // Renpho Scale
  'com.google.weight': {
    tabName: 'Renpho Scale',
    columns: ['Date', 'Time', 'Weight (lbs)', 'Body Fat %', 'Muscle Mass %', 'Visceral Fat'],
    keyColumn: 'Weight (lbs)',
    unit: 'lbs',
    dataSourceApp: 'Renpho'
  },
  'com.google.body.fat.percentage': {
    tabName: 'Renpho Scale',
    columns: ['Date', 'Time', 'Weight (lbs)', 'Body Fat %', 'Muscle Mass %', 'Visceral Fat'],
    keyColumn: 'Body Fat %',
    unit: '%',
    dataSourceApp: 'Renpho'
  },
  'com.google.lean.body.mass': {
    tabName: 'Renpho Scale',
    columns: ['Date', 'Time', 'Weight (lbs)', 'Body Fat %', 'Muscle Mass %', 'Visceral Fat'],
    keyColumn: 'Muscle Mass %',
    unit: '%',
    dataSourceApp: 'Renpho'
  },
  
  // Keto-Mojo
  'com.google.blood_glucose': {
    tabName: 'Keto-Mojo GKI',
    columns: ['Date', 'Time', 'Glucose (mg/dL)', 'Ketones (mmol/L)', 'GKI', 'Notes'],
    keyColumn: 'Glucose (mg/dL)',
    unit: 'mg/dL',
    dataSourceApp: 'Keto-Mojo'
  },
  'com.google.blood_ketones': {
    tabName: 'Keto-Mojo GKI',
    columns: ['Date', 'Time', 'Glucose (mg/dL)', 'Ketones (mmol/L)', 'GKI', 'Notes'],
    keyColumn: 'Ketones (mmol/L)',
    unit: 'mmol/L',
    dataSourceApp: 'Keto-Mojo'
  },
  
  // Body Tape Measure
  'com.google.body.measurements.waist_circumference': {
    tabName: 'Body Tape Measure',
    columns: ['Date', 'Time', 'Waist', 'Chest', 'Hip'],
    keyColumn: 'Waist',
    unit: 'in',
    dataSourceApp: 'Manual'
  },
  'com.google.body.measurements.chest_circumference': {
    tabName: 'Body Tape Measure',
    columns: ['Date', 'Time', 'Waist', 'Chest', 'Hip'],
    keyColumn: 'Chest',
    unit: 'in',
    dataSourceApp: 'Manual'
  },
  'com.google.body.measurements.hip_circumference': {
    tabName: 'Body Tape Measure',
    columns: ['Date', 'Time', 'Waist', 'Chest', 'Hip'],
    keyColumn: 'Hip',
    unit: 'in',
    dataSourceApp: 'Manual'
  },
  
  // Blood Pressure
  'com.google.blood_pressure': {
    tabName: 'Blood Pressure',
    columns: ['Date', 'Time', 'Systolic', 'Diastolic', 'Pulse', 'Notes'],
    keyColumn: 'Systolic',
    unit: 'mmHg',
    dataSourceApp: 'Blood Pressure App'
  },
  
  // Pixel Watch / Fitness Tracker
  'com.google.step_count.delta': {
    tabName: 'Pixel Watch',
    columns: ['Date', 'Steps', 'Sleep (min)', 'HRV (ms)', 'Resting HR', 'Notes'],
    keyColumn: 'Steps',
    unit: 'steps',
    dataSourceApp: 'Pixel Watch'
  },
  'com.google.sleep.segment': {
    tabName: 'Pixel Watch',
    columns: ['Date', 'Steps', 'Sleep (min)', 'HRV (ms)', 'Resting HR', 'Notes'],
    keyColumn: 'Sleep (min)',
    unit: 'min',
    dataSourceApp: 'Pixel Watch'
  },
  'com.google.heart_rate.bpm': {
    tabName: 'Pixel Watch',
    columns: ['Date', 'Steps', 'Sleep (min)', 'HRV (ms)', 'Resting HR', 'Notes'],
    keyColumn: 'Resting HR',
    unit: 'bpm',
    dataSourceApp: 'Pixel Watch'
  },
  'com.google.heart_rate.variability': {
    tabName: 'Pixel Watch',
    columns: ['Date', 'Steps', 'Sleep (min)', 'HRV (ms)', 'Resting HR', 'Notes'],
    keyColumn: 'HRV (ms)',
    unit: 'ms',
    dataSourceApp: 'Pixel Watch'
  }
};

/**
 * Get mapping for a metric type
 */
function getMetricMapping(metricType) {
  return METRIC_MAPPING[metricType] || null;
}

/**
 * Validate that config has required fields
 */
function validateConfig() {
  if (!CONFIG.SPREADSHEET_ID || CONFIG.SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
    throw new Error('CONFIG.SPREADSHEET_ID not set. Please update config.gs with your Sheet ID.');
  }
  return true;
}
