/**
 * Utility functions for data formatting, validation, and logging
 */

/**
 * Format data point as a row for sheet insertion
 */
function formatRowForSheet(dataPoint, mapping) {
  const logger = createLogger('formatRowForSheet');
  const date = new Date(dataPoint.timestamp);
  
  // Convert to configured timezone
  const formatter = Intl.DateTimeFormat('en-US', {
    timeZone: CONFIG.TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const [datePart, timePart] = formatter.format(date).split(', ');
  const [month, day, year] = datePart.split('/');
  const formattedDate = `${month}/${day}/${year}`;
  const formattedTime = timePart;
  
  // Create row based on tab structure
  const row = {};
  mapping.columns.forEach(col => {
    row[col] = '';
  });
  
  // Set date and time
  if (mapping.columns.includes('Date')) {
    row['Date'] = formattedDate;
  }
  if (mapping.columns.includes('Time')) {
    row['Time'] = formattedTime;
  }
  
  // Set the main value
  if (mapping.keyColumn) {
    row[mapping.keyColumn] = dataPoint.value;
  }
  
  // Convert to array matching column order
  return mapping.columns.map(col => row[col] || '');
}

/**
 * Validate a row before insertion
 */
function validateRow(row, mapping) {
  const logger = createLogger('validateRow');
  
  // Check required columns
  if (!row[0]) {
    logger.warn('Row missing Date');
    return false;
  }
  
  // Check for valid types
  const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!datePattern.test(row[0])) {
    logger.warn('Invalid date format: ' + row[0]);
    return false;
  }
  
  return true;
}

/**
 * Parse date string in various formats
 */
function parseDate(dateStr) {
  if (typeof dateStr === 'object' && dateStr instanceof Date) {
    return dateStr;
  }
  
  // Try common formats
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/
  ];
  
  for (const format of formats) {
    const match = String(dateStr).match(format);
    if (match) {
      if (match[1].length === 4) {
        return new Date(match[1], match[2] - 1, match[3]);
      } else {
        return new Date(match[3], match[1] - 1, match[2]);
      }
    }
  }
  
  return new Date(dateStr);
}

/**
 * Simple logger class
 */
class Logger {
  constructor(name) {
    this.name = name;
    this.logs = [];
    this.startTime = new Date();
  }
  
  log(message) {
    const entry = `[${this.name}] ${message}`;
    this.logs.push(entry);
    console.log(entry);
  }
  
  warn(message) {
    const entry = `[${this.name}] WARNING: ${message}`;
    this.logs.push(entry);
    console.warn(entry);
  }
  
  error(message) {
    const entry = `[${this.name}] ERROR: ${message}`;
    this.logs.push(entry);
    console.error(entry);
  }
  
  getLogs() {
    return this.logs;
  }
}

/**
 * Create a logger instance
 */
function createLogger(name) {
  return new Logger(name);
}

/**
 * Generate SHA hash for deduplication
 */
function generateHash(data) {
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_1,
    JSON.stringify(data)
  );
}

/**
 * Convert milliseconds to readable duration
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  Utilities.sleep(ms);
}
