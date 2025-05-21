const cron = require('node-cron');
const DataCrawler = require('./DataCrawler');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'scraper.log' }),
    new winston.transports.Console(),
  ],
});

const urls = [
  'https://www.traveloka.com/vi-vn/bus-and-shuttle/search?st=a10009794.a10010000&stt=CITY_GEO.CITY_GEO&stn=Ho%20Chi%20Minh%20City.Lam%20Dong%20Province&dt=05-05-2025.null&ps=1&stc=',
  'https://www.traveloka.com/vi-vn/bus-and-shuttle/search?st=a10009794.a10010169&stt=CITY_GEO.CITY_GEO&stn=Ho%20Chi%20Minh%20City.Da%20Lat&dt=05-05-2025.null&ps=1&stc=',
  'https://www.traveloka.com/vi-vn/bus-and-shuttle/search?st=a10009794.a10009889&stt=CITY_GEO.CITY_GEO&stn=Ho%20Chi%20Minh%20City.Ba%20Ria%20-%20Vung%20Tau&dt=05-05-2025.null&ps=1&stc=',
  'https://www.traveloka.com/vi-vn/bus-and-shuttle/search?st=a10009889.a10009794&stt=CITY_GEO.CITY_GEO&stn=Ba%20Ria%20-%20Vung%20Tau.Ho%20Chi%20Minh%20City&dt=05-05-2025.null&ps=1&stc=',
  'https://www.traveloka.com/vi-vn/bus-and-shuttle/search?st=a10010000.a10009794&stt=CITY_GEO.CITY_GEO&stn=Lam%20Dong%20Province.Ho%20Chi%20Minh%20City&dt=05-05-2025.null&ps=1&stc=',
  'https://www.traveloka.com/vi-vn/bus-and-shuttle/search?st=a10010083.a10009794&stt=CITY_GEO.CITY_GEO&stn=Da%20Nang.Ho%20Chi%20Minh%20City&dt=05-05-2025.null&ps=1&stc=',
  'https://www.traveloka.com/vi-vn/bus-and-shuttle/search?st=a10009794.a10010083&stt=CITY_GEO.CITY_GEO&stn=Ho%20Chi%20Minh%20City.Da%20Nang&dt=05-05-2025.null&ps=1&stc='
];

class ScraperScheduler {
  start() {
    // hẹn lịch cào lúc 2 giờ sáng
    cron.schedule('0 2 * * *', async () => {
      logger.info('Bắt đầu cào dữ liệu vào 2 AM');
      try {
        await DataCrawler.crawlAndSave(urls);
        logger.info('đặt lịch cào thành công');
      } catch (error) {
        logger.error(`lịch cào sự cố failed: ${error.message}`);
      }
    });
    logger.info('bắt đầu lịch cào');
  }
}

module.exports = new ScraperScheduler();