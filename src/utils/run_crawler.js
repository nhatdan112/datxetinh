const { crawlBusData } = require('./DataCrawler');

// Validate date format (e.g., DD-MMM-YYYY)
function isValidDate(dateStr) {
  const regex = /^\d{2}-[A-Za-z]{3}-\d{4}$/;
  if (!regex.test(dateStr)) return false;
  try {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

const [,, source, destination, date] = process.argv;

console.log(`Received arguments: source=${source}, destination=${destination}, date=${date || '12-May-2025'}`);

if (!source || !destination) {
  console.error('Usage: node run_crawler.js <source> <destination> [date]');
  process.exit(1);
}

const crawlDate = date || '12-May-2025';
if (!isValidDate(crawlDate)) {
  console.error(`Invalid date format: ${crawlDate}. Expected DD-MMM-YYYY (e.g., 12-May-2025)`);
  process.exit(1);
}

crawlBusData(source, destination, crawlDate)
  .then(() => {
    console.log('Crawling completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Crawling error:', err.message);
    console.error('Stack trace:', err.stack);
    process.exit(1);
  });