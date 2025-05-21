const puppeteer = require('puppeteer');
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

// Ánh xạ tên thành phố sang cityId cho redbus.vn
const CITY_IDS = {
  'Sài Gòn TPHCM': { id: '253239', name: 'Hồ Chí Minh (Tất cả các điểm)' },
  'Vũng Tàu': { id: '195423', name: 'Bà Rịa Vũng Tàu (Tất cả các điểm)' },
};

async function crawlBusData(source, destination, date = '12-May-2025') {
  console.log(`Starting crawl for source: ${source}, destination: ${destination}, date: ${date}`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null, // Để tránh lỗi hiển thị trên một số trang
  });
  const allBusData = [];

  // Chuẩn hóa departureDate thành DD-MMM-YYYY
  let departureDate;
  try {
    const dateObj = new Date(date);
    departureDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  } catch (error) {
    console.error(`Invalid date format: ${date}. Using default: 12-May-2025`);
    departureDate = '12-May-2025';
  }

  // Tạo URL động
  const urls = [
    `https://www.redbus.vn/search?fromCityName=${encodeURIComponent(CITY_IDS[source]?.name || source)}&fromCityId=${CITY_IDS[source]?.id || '0'}&srcCountry=VNM&toCityName=${encodeURIComponent(CITY_IDS[destination]?.name || destination)}&toCityId=${CITY_IDS[destination]?.id || '0'}&destCountry=VNM&onward=${date}&opId=0&busType=Any`,
    `https://vexe24h.vn/ve-xe-${source.toLowerCase().replace(/\s/g, '-')}-di-${destination.toLowerCase().replace(/\s/g, '-')}/`,
  ];

  for (const url of urls) {
    console.log(`Scraping ${url}...`);
    const page = await browser.newPage();

    // Thiết lập User Agent và mã hóa UTF-8
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Charset': 'utf-8' });

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      console.log(`Loaded ${url}`);
    } catch (error) {
      console.error(`Failed to load ${url}: ${error.message}`);
      await page.close();
      continue;
    }

    // Trích xuất departureDate từ trang
    let pageDepartureDate = departureDate;
    if (url.includes('redbus.vn')) {
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      pageDepartureDate = urlParams.get('onward') || departureDate;
    } else if (url.includes('vexe24h.vn')) {
      try {
        pageDepartureDate = await page.evaluate(() => {
          const dateElement = document.querySelector('input[type="date"], .date-picker, .date-selector, [data-date], .selected-date');
          return dateElement?.value || dateElement?.dataset.date || dateElement?.innerText?.trim() || '12-May-2025';
        });
        // Chuẩn hóa định dạng
        const dateObj = new Date(pageDepartureDate.replace(/[^\w\s-]/g, ''));
        pageDepartureDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
      } catch (error) {
        console.error(`Failed to extract departure date from ${url}: ${error.message}`);
        pageDepartureDate = departureDate;
      }
    }
    console.log(`Departure date for ${url}: ${pageDepartureDate}`);

    // Log page content length for debugging
    const pageContent = await page.content();
    console.log(`Page content length: ${pageContent.length} characters`);

    // Kiểm tra dữ liệu chuyến xe
    let hasData = false;
    if (url.includes('vexe24h.vn')) {
      try {
        await page.waitForSelector('.bus-list, .trip-table, .schedule-table, table, .bus-item', { timeout: 15000 });
        console.log(`Bus list or table found on ${url}`);
        hasData = true;
      } catch (error) {
        console.log(`No bus list or table found on ${url}. Checking for no-data message...`);
        const noDataMessage = await page.evaluate(() => {
          return document.body.innerText.includes('Không có chuyến xe nào') || 
                 document.body.innerText.includes('No trips found') || 
                 document.querySelector('.no-results, .empty-state');
        });
        if (noDataMessage) {
          console.log(`No bus data available on ${url}`);
          await page.close();
          continue;
        }
        console.error(`Failed to find bus list or table on ${url}: ${error.message}`);
        await page.close();
        continue;
      }
    } else if (url.includes('redbus.vn')) {
      try {
        await page.waitForSelector('.bus-items .row-sec, .bus-item, .trip-card, .bus-card', { timeout: 15000 });
        console.log(`Bus items found on ${url}`);
        hasData = true;
      } catch (error) {
        console.error(`Bus items not found on ${url}: ${error.message}`);
        await page.close();
        continue;
      }
    }

    // Chờ ngẫu nhiên để tránh bị chặn
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    let busData = [];

    if (url.includes('redbus.vn')) {
      try {
        busData = await page.evaluate((source, destination, departureDate) => {
          const buses = [];
          const busElements = document.querySelectorAll('.bus-items .row-sec, .bus-item, .trip-card, .bus-card');

          console.log(`Found ${busElements.length} bus elements on redbus.vn`);

          busElements.forEach(bus => {
            const operator = bus.querySelector('.travels, .operator-name, .bus-operator, .company-name')?.innerText.trim() || 'N/A';
            const departureTime = bus.querySelector('.dp-time, .departure-time, .start-time')?.innerText.trim() || '08:00';
            const durationText = bus.querySelector('.dur, .duration, .travel-time')?.innerText.trim() || '2h 30m';
            const ratingText = bus.querySelector('.rating-sec span, .rating, .review-score')?.innerText.trim() || '4.0';
            const priceText = bus.querySelector('.fare span, .price, .ticket-price')?.innerText.trim() || '200000';
            const busType = bus.querySelector('.bus-type, .vehicle-type, .bus-category')?.innerText.trim() || 'Standard';
            const sourceStation = bus.querySelector('.dp-loc, .source-location')?.innerText.trim() || source;
            const destinationStation = bus.querySelector('.bp-loc, .destination-location')?.innerText.trim() || destination;
            const amenities = Array.from(bus.querySelectorAll('.amenity span, .amenities li, .feature-item')).map(span => span.innerText.trim()).filter(Boolean);

            let duration = 150; // Mặc định 2.5 giờ nếu không parse được
            if (durationText) {
              const hoursMatch = durationText.match(/(\d+)h/);
              const minsMatch = durationText.match(/(\d+)m/);
              const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
              const mins = minsMatch ? parseInt(minsMatch[1], 10) : 0;
              duration = (hours * 60) + mins;
            }

            const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) * 1000 || 200000 : 200000;
            const rating = ratingText ? parseFloat(ratingText) || 4.0 : 4.0;

            buses.push({
              source: 'redbus.vn',
              startingPoint: source,
              destination: destination,
              operator: operator,
              departureTime: departureTime,
              duration: duration,
              rating: rating,
              price: price,
              sourceStationId: `station-${Math.random().toString(36).substr(2, 9)}`,
              destinationStationId: `station-${Math.random().toString(36).substr(2, 9)}`,
              sourceStation: sourceStation,
              destinationStation: destinationStation,
              busType: busType,
              amenities: amenities,
              operatorType: operator.toLowerCase().includes('luxury') || busType.toLowerCase().includes('limousine') ? 'Large' : 'Small',
              rankScore: rating * 0.2 + (price > 0 ? 1000000 / price : 0) * 0.1,
              availableSeats: 30,
              departureDate: departureDate,
            });
          });

          return buses;
        }, source, destination, pageDepartureDate);
        console.log(`Redbus.vn busData: ${JSON.stringify(busData, null, 2)}`);
      } catch (error) {
        console.error(`Error evaluating redbus.vn data: ${error.message}`);
      }

      busData.forEach(bus => {
        bus.id = uuidv4();
      });
    } else if (url.includes('vexe24h.vn')) {
      try {
        busData = await page.evaluate((source, destination, departureDate) => {
          const buses = [];
          const tableRows = document.querySelectorAll('.bus-list .bus-row, .trip-table .trip-row, table tr, .bus-item');

          console.log(`Found ${tableRows.length} table rows or bus rows on vexe24h.vn`);

          tableRows.forEach((row, index) => {
            if (row.classList.contains('header-row')) return;

            const columns = row.querySelectorAll('td, .bus-column, .trip-column');
            if (columns.length < 4) return;

            const operator = columns[0].querySelector('a, .operator, .company')?.innerText.trim() || 'N/A';
            const departureCell = columns[1] || columns[0];
            const departureTime = departureCell.innerText.match(/Giờ đi: (\d{2}:\d{2})|(\d{2}:\d{2})/)?.[1] || 
                                 departureCell.querySelector('.departure-time, .start-time')?.innerText.trim() || '08:00';
            const pickupPoint = Array.from(departureCell.querySelectorAll('p, .pickup-point, .source'))
              .find(p => !p.innerText.includes('Giờ đi'))?.innerText.trim() || 'Bến xe Miền Tây';
            const arrivalCell = columns[2] || columns[1];
            const arrivalTime = arrivalCell.innerText.match(/Giờ đến: (\d{2}:\d{2})|(\d{2}:\d{2})/)?.[1] || 
                               arrivalCell.querySelector('.arrival-time, .end-time')?.innerText.trim() || '10:30';
            const dropoffPoint = Array.from(arrivalCell.querySelectorAll('p, .dropoff-point, .destination'))
              .find(p => !p.innerText.includes('Giờ đến'))?.innerText.trim() || 'Bến xe Vũng Tàu';
            const busTypeElement = columns[3]?.innerText.trim() || columns[2]?.innerText.trim();
            const busType = busTypeElement && !busTypeElement.includes('Bà Rịa') ? busTypeElement : 'Standard';
            const priceText = columns[4]?.innerText.trim() || columns[3]?.innerText.trim() || '200000';
            const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) * 1000 || 200000 : 200000;
            const amenities = Array.from(columns[0].querySelectorAll('.amenity, .amenities span, .feature')).map(span => span.innerText.trim()).filter(Boolean);
            const ratingText = columns[0].querySelector('.rating, .review-score')?.innerText.trim() || '4.0';
            const rating = ratingText ? parseFloat(ratingText) || 4.0 : 4.0;

            let duration = 150; // Mặc định 2.5 giờ nếu không parse được
            if (departureTime !== 'N/A' && arrivalTime !== 'N/A') {
              try {
                const [depHour, depMin] = departureTime.split(':').map(Number);
                const [arrHour, arrMin] = arrivalTime.split(':').map(Number);
                let depTotalMin = (depHour * 60) + depMin;
                let arrTotalMin = (arrHour * 60) + arrMin;
                if (arrTotalMin < depTotalMin) arrTotalMin += 24 * 60; // Xử lý qua nửa đêm
                duration = arrTotalMin - depTotalMin;
              } catch (error) {
                console.error(`Error calculating duration: ${error.message}`);
              }
            }

            buses.push({
              source: 'vexe24h.vn',
              startingPoint: source,
              destination: destination,
              operator: operator,
              departureTime: departureTime,
              pickupPoint: pickupPoint,
              arrivalTime: arrivalTime,
              dropoffPoint: dropoffPoint,
              busType: busType,
              price: price,
              sourceStationId: `station-${Math.random().toString(36).substr(2, 9)}`,
              destinationStationId: `station-${Math.random().toString(36).substr(2, 9)}`,
              sourceStation: pickupPoint,
              destinationStation: dropoffPoint,
              amenities: amenities,
              operatorType: operator.toLowerCase().includes('limousine') || busType.toLowerCase().includes('limousine') ? 'Large' : 'Small',
              rating: rating,
              rankScore: rating * 0.2 + (price > 0 ? 1000000 / price : 0) * 0.1,
              availableSeats: 30,
              departureDate: departureDate,
            });
          });

          return buses;
        }, source, destination, pageDepartureDate);
        console.log(`Vexe24h.vn busData: ${JSON.stringify(busData, null, 2)}`);
      } catch (error) {
        console.error(`Error evaluating vexe24h.vn data: ${error.message}`);
      }

      busData.forEach(bus => {
        bus.id = uuidv4();
        delete bus.pickupPoint;
        delete bus.dropoffPoint;
        delete bus.arrivalTime;
      });
    }

    allBusData.push(...busData);
    await page.close();
  }

  // Lưu vào MongoDB
  const uri = 'mongodb+srv://driver:01236720230a@cluster0.2qh9fjz.mongodb.net/busData?retryWrites=true&w=majority';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('busData');
    const collection = db.collection('buses');

    for (const bus of allBusData) {
      await collection.updateOne(
        { id: bus.id },
        { $set: bus },
        { upsert: true }
      );
    }

    console.log(`Saved ${allBusData.length} bus records to MongoDB`);
  } catch (error) {
    console.error('MongoDB error:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }

  await browser.close();
  console.log(`Crawling completed with ${allBusData.length} records`);
  return allBusData;
}

module.exports = { crawlBusData };

if (require.main === module) {
  crawlBusData('Sài Gòn TPHCM', 'Vũng Tàu', '12-May-2025')
    .then(() => console.log('Crawling completed'))
    .catch(err => console.error('Crawling error:', err));
}