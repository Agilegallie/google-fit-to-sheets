# Frequently Asked Questions

## General

### Q: How long does it take to set up?
A: 15-20 minutes for basic setup. Most of that is waiting for OAuth and testing.

### Q: Does this work offline?
A: No, it needs internet to pull from Google Fit API and write to Sheets.

### Q: How often should I run this?
A: Daily is recommended. You can run it 2-4 times daily if needed.

### Q: What devices are supported?
A: Any device that syncs to Google Fit: Pixel Watch, Fitbit, Garmin, Renpho Scale, Keto-Mojo, etc.

## Data & Sync

### Q: Why is my data not syncing?
A: Common causes:
1. Google Fit on your phone hasn't synced with cloud (wait 1-7 days)
2. Apps Script OAuth not authorized
3. Sheet ID not configured correctly
4. API not enabled in Google Cloud

### Q: How far back does it sync?
A: By default, 7 days. Change `LOOKBACK_DAYS` in config.gs to adjust.

### Q: Will it create duplicate rows?
A: No, it has built-in deduplication.

### Q: Can I manually edit rows?
A: Yes! The script will skip them on next run if they match existing timestamps.

## Troubleshooting

### Q: How do I see what happened during a sync?
A: Click **Executions** in Apps Script. Each run shows logs.

### Q: How do I test without scheduling?
A: Click the **▶ Run** button next to `syncHealthData`.

### Q: Can I see the raw data being fetched?
A: Yes! Run `debugGetFitData()`.

### Q: How do I debug sheet data?
A: Run `debugGetSheetData()`.

## Customization

### Q: Can I add custom metrics?
A: Yes, edit `METRIC_MAPPING` in config.gs.

### Q: Can I change how often it runs?
A: Yes, click **Triggers** in Apps Script and edit frequency.

### Q: Can I change my timezone?
A: Yes, update `TIMEZONE` in config.gs.

## Privacy & Security

### Q: Is my data secure?
A: Yes, it stays within Google ecosystem.

### Q: What data does the script access?
A: Only Google Fit data from your account.

### Q: Who can see my data?
A: Only people you share the Google Sheet with.

---

**Still have questions?** Check the README or review the inline code comments.
