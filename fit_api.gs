/**
 * Google Fit API integration
 * Handles authentication, data fetching, and parsing
 */

/**
 * Fetch health data from Google Fit
 * Returns organized data by metric type
 */
function fetchGoogleFitData() {
  validateConfig();
  
  const logger = createLogger('fetchGoogleFitData');
  const endTimeMillis = new Date().getTime();
  const startTimeMillis = endTimeMillis - (CONFIG.LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  
  logger.log(`Fetching data from ${new Date(startTimeMillis).toISOString()} to ${new Date(endTimeMillis).toISOString()}`);
  
  const aggregatedData = {};
  
  try {
    // Fetch each metric type
    for (const [metricName, metricType] of Object.entries(CONFIG.FIT_DATA_SOURCES)) {
      try {
        logger.log(`Fetching ${metricName} (${metricType})...`);
        
        const data = queryGoogleFitDataSource({
          dataTypeName: metricType,
          startTimeMillis: startTimeMillis,
          endTimeMillis: endTimeMillis
        });
        
        if (data && data.length > 0) {
          aggregatedData[metricType] = data;
          logger.log(`  → Retrieved ${data.length} data points`);
        }
        
      } catch (e) {
        logger.warn(`Error fetching ${metricName}: ${e.message}`);
      }
    }
    
    return aggregatedData;
    
  } catch (error) {
    logger.error('Fatal error in fetchGoogleFitData: ' + error.message);
    throw error;
  }
}

/**
 * Query Google Fit data source
 * Uses HealthConnect API if available, falls back to Fit REST API
 */
function queryGoogleFitDataSource(options) {
  const logger = createLogger('queryGoogleFitDataSource');
  
  try {
    // Try to get data from Google Fit REST API
    const url = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';
    
    const payload = {
      aggregateBy: [{
        dataTypeName: options.dataTypeName,
        dataSourceId: `derived:com.google.android.gms:${options.dataTypeName}:com.google.android.gms`,
      }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: options.startTimeMillis,
      endTimeMillis: options.endTimeMillis
    };
    
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken(),
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      logger.warn(`API returned status ${response.getResponseCode()}: ${response.getContentText()}`);
      return [];
    }
    
    const result = JSON.parse(response.getContentText());
    const dataPoints = [];
    
    // Parse response buckets
    if (result.bucket && Array.isArray(result.bucket)) {
      for (const bucket of result.bucket) {
        if (bucket.dataset && Array.isArray(bucket.dataset)) {
          for (const dataset of bucket.dataset) {
            if (dataset.point && Array.isArray(dataset.point)) {
              for (const point of dataset.point) {
                dataPoints.push(parseDataPoint(point, options.dataTypeName));
              }
            }
          }
        }
      }
    }
    
    return dataPoints;
    
  } catch (error) {
    logger.error(`Error querying data source: ${error.message}`);
    return [];
  }
}

/**
 * Parse individual data point from Fit API
 */
function parseDataPoint(point, dataTypeName) {
  const timestamp = parseInt(point.startTimeNanos) / 1000000;
  const value = point.value ? point.value[0] : null;
  
  let parsedValue = null;
  if (value) {
    // Try different value types
    if (value.fpVal !== undefined) {
      parsedValue = value.fpVal;
    } else if (value.intVal !== undefined) {
      parsedValue = value.intVal;
    } else if (value.stringVal !== undefined) {
      parsedValue = value.stringVal;
    }
  }
  
  return {
    timestamp: timestamp,
    date: new Date(timestamp),
    value: parsedValue,
    metricType: dataTypeName,
    rawPoint: point
  };
}

/**
 * Alternative: Fetch from Health Connect directly (newer Android API)
 */
function fetchFromHealthConnect() {
  const logger = createLogger('fetchFromHealthConnect');
  logger.warn('Health Connect API not yet implemented. Using Google Fit API instead.');
  
  return {};
}
