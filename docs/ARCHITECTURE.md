# Architecture & Data Flow

## System Overview

```
┌─────────────────────┐
│  Google Fit API     │
│  (Pixel Watch,      │
│   Renpho, Keto)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│  Apps Script (Main)         │
│  ┌─────────────────────┐   │
│  │ main.gs             │   │
│  │ - syncHealthData()  │   │
│  │ - Orchestration     │   │
│  └─────────────────────┘   │
└──────────┬──────────────────┘
           │
      ┌────┴────┬────────────┬─────────┐
      ▼         ▼            ▼         ▼
┌─────────┐ ┌──────────┐ ┌────────┐ ┌─────────┐
│fit_api  │ │sheets_api│ │utils   │ │config   │
│---------|─|Fetch Fit │ │Read    │ │Mapping  │
│Query    │ │data      │ │Sheets  │ │Config   │
│Parse    │ │Append    │ │Format  │ │Logging  │
│Transform│ │Dedupe    │ │Validate│ │Triggers │
└─────────┘ └──────────┘ └────────┘ └─────────┘
           │
      ┌────┴────┐
      ▼         ▼
┌──────────────────────────────┐
│  Google Sheet                │
│  ┌──────────┐┌───────────┐  │
│  │Renpho    ││Keto-Mojo  │  │
│  │BP        ││Pixel Watch│  │
│  │Tape      ││Sync Logs  │  │
│  └──────────┘└───────────┘  │
└──────────────────────────────┘
```

## Execution Flow

### Phase 1: Initialization
```
User clicks Run / Trigger fires
       ↓
validateConfig() - Check spreadsheet ID is set
       ↓
Create logger instance
       ↓
Log execution start timestamp
```

### Phase 2: Data Fetching
```
fetchGoogleFitData()
       ↓
For each metric type in CONFIG.FIT_DATA_SOURCES:
       ↓
queryGoogleFitDataSource(metric)
       ↓
Make HTTP request to Google Fit REST API
       ↓
ParseDataPoint() - Convert API response to standard format
       ↓
Aggregate results by metric type
```

### Phase 3: Sheet Preparation
```
loadAllSheetData()
       ↓
For each tab in spreadsheet:
       ↓
Read all existing rows (for deduplication)
       ↓
Store in memory: { tabName: [rows] }
```

### Phase 4: Data Processing
```
For each metric type with fetched data:
       ↓
getMetricMapping(metricType) - Find destination tab
       ↓
For each data point:
       ├─ isDuplicateEntry() - Check if already exists
       ├─ formatRowForSheet() - Convert to sheet format
       ├─ validateRow() - Check required fields
       └─ appendRowToSheet() - Insert into sheet
       ↓
Track: processed, appended, skipped, errors
```

### Phase 5: Logging & Reporting
```
Calculate sync duration
       ↓
If LOG_SHEET_NAME configured:
       ├─ getOrCreateLogSheet()
       └─ saveExecutionLog() - Write summary row
       ↓
Log execution complete
       ↓
Return results object
```

## Data Structures

### Google Fit Data Point (Internal)
```javascript
{
  timestamp: 1234567890000,        // milliseconds since epoch
  date: Date object,               // JavaScript Date
  value: 185.2,                    // numeric value from API
  metricType: 'com.google.weight', // metric identifier
  rawPoint: { ... }                // original API response
}
```

### Sheet Row (Standard Format)
```javascript
[
  '06/30/2026',      // Date (formatted)
  '06:15:00',        // Time (formatted)
  185.2,             // Value 1
  22.5,              // Value 2
  52.1,              // Value 3
  10                 // Value 4
]
```

### Metric Mapping
```javascript
{
  tabName: 'Renpho Scale',
  columns: ['Date', 'Time', 'Weight (lbs)', 'Body Fat %', ...],
  keyColumn: 'Weight (lbs)',       // Primary value column
  unit: 'lbs',                      // Display unit
  dataSourceApp: 'Renpho'           // Source app identifier
}
```

## API Interactions

### Google Fit API

**Endpoint:** `POST https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`

**Request:**
```json
{
  "aggregateBy": [{
    "dataTypeName": "com.google.weight",
    "dataSourceId": "derived:com.google.android.gms:..."
  }],
  "bucketByTime": { "durationMillis": 86400000 },
  "startTimeMillis": 1719792000000,
  "endTimeMillis": 1720396800000
}
```

## Error Handling

### Graceful Degradation

```javascript
try {
  // Attempt operation
} catch (error) {
  logger.error('Error details');
  results.errors.push('error description');
  // Continue with next item
}
```

**Philosophy:**
- Errors in one metric don't stop other metrics
- Partial sync is better than complete failure
- All errors logged for debugging

## Deduplication Strategy

### Timestamp-Based Matching

```javascript
For each existing row:
  Get row date/time
  Calculate difference from new data timestamp
  If difference < 1 second:
    Mark as duplicate
```

**Why 1 second tolerance?**
- Accounts for timezone conversion precision
- Prevents false duplicates from rounding
- Real duplicates are exact or very close

## Performance Characteristics

### Typical Execution (Daily Sync)
- Fetch time: 2-5 seconds
- Parse time: 1-2 seconds
- Sheet load: 3-5 seconds
- Append time: 0.1-0.5 seconds per row
- **Total: 8-15 seconds** for ~5 rows of data

### Scaling
- 50 rows per day: ~30 seconds
- 200 rows per day: ~2 minutes
- Apps Script timeout: 6 minutes

## Authorization & Scope

### OAuth Scopes Required
1. `fitness.body.read` - Read weight/body metrics
2. `fitness.blood_glucose.read` - Read glucose
3. `fitness.blood_pressure.read` - Read BP
4. `fitness.heart_rate.read` - Read HR
5. `fitness.sleep.read` - Read sleep
6. `spreadsheets` - Write to Sheets

## Data Privacy

### What Data Flows Where

```
Your Phone Device
     ↓ (device → Google Fit API)
Google Fit Cloud
     ↓ (API → Apps Script)
Apps Script Runtime
     ↓ (via Sheets API)
Google Sheet
```

### Data Retention
- Google Fit: Retained by Google
- Apps Script: Temporary during execution only
- Google Sheet: Retained as long as you keep it
- Execution logs: Kept for 90 days
