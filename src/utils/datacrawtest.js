const puppeteer = require('puppeteer');
const fs = require('fs');

async function crawlBusData(urls) {
  const browser = await puppeteer.launch({
    headless: false, // Set to false for debugging to see the browser
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const allBusData = [];

  for (const url of urls) {
    console.log(`Scraping ${url}...`);
    const page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigate to the target page
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    } catch (error) {
      console.error(`Failed to load ${url}: ${error.message}`);
      await page.close();
      continue;
    }

    // Wait for dynamic content to load
    if (url.includes('vexe24h.vn')) {
      try {
        await page.waitForSelector('table', { timeout: 15000 });
        console.log(`Table found on ${url}`);
      } catch (error) {
        console.log(`Table not found on ${url}. Checking for alternative content...`);
        const noDataMessage = await page.evaluate(() => {
          return document.querySelector('body')?.innerText.includes('Không có chuyến xe nào') || false;
        });
        if (noDataMessage) {
          console.log(`No bus data available on ${url}`);
          await page.close();
          continue;
        }
      }
    }

    // Add a random delay to mimic human behavior
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    let busData = [];
    let startingPoint = 'N/A';
    let destination = 'N/A';

    if (url.includes('redbus.vn')) {
      startingPoint = await page.evaluate(() => {
        return document.querySelector('span.src')?.innerText.trim() || 'N/A';
      });
      destination = await page.evaluate(() => {
        return document.querySelector('span.dst')?.innerText.trim() || 'N/A';
      });

      busData = await page.evaluate(() => {
        const buses = [];
        const busElements = document.querySelectorAll('.bus-items .row-sec');

        busElements.forEach(bus => {
          const operator = bus.querySelector('.travels')?.innerText || 'N/A';
          const departure = bus.querySelector('.dp-time')?.innerText || 'N/A';
          const duration = bus.querySelector('.dur')?.innerText || 'N/A';
          const arrival = bus.querySelector('.bp-time')?.innerText || 'N/A';
          const rating = bus.querySelector('.rating-sec span')?.innerText || 'N/A';
          const price = bus.querySelector('.fare span')?.innerText || 'N/A';

          buses.push({
            source: 'RedBus',
            startingPoint: 'N/A', // Will be overwritten
            destination: 'N/A',   // Will be overwritten
            operator,
            departure,
            duration,
            arrival,
            rating,
            price
          });
        });

        return buses;
      });

      busData.forEach(bus => {
        bus.startingPoint = startingPoint;
        bus.destination = destination;
      });
    } else if (url.includes('vexe24h.vn')) {
      const routeInfo = await page.evaluate(() => {
        const breadcrumbElement = document.querySelector('span.breadcrumb_last');
        let routeText = breadcrumbElement?.innerText || '';

        if (!routeText) {
          const titleElement = document.querySelector('h1') || document.querySelector('title');
          routeText = titleElement?.innerText || '';
        }

        const match = routeText.match(/Sài Gòn TPHCM đi (.+)/) || routeText.match(/Sài Gòn đi (.+)/) || [];
        const destination = match[1] ? match[1].trim() : 'N/A';
        return { startingPoint: 'Sài Gòn TPHCM', destination };
      });

      startingPoint = routeInfo.startingPoint;
      destination = routeInfo.destination;

      busData = await page.evaluate(() => {
        const buses = [];
        const tableRows = document.querySelectorAll('table tr');

        console.log(`Found ${tableRows.length} rows in table`);

        tableRows.forEach((row, index) => {
          if (index === 0) return; // Skip header

          const columns = row.querySelectorAll('td');
          console.log(`Row ${index} has ${columns.length} columns`);

          if (columns.length < 5) return; // Adjusted to 5 since the HTML shows 5 columns

          // Operator is inside an <a> tag
          const operator = columns[0].querySelector('a')?.innerText.trim() || 'N/A';

          // Departure time and pickup point are in <p> tags within the same <td>
          const departureCell = columns[1];
          const departureTime = departureCell.innerText.match(/Giờ đi: (\d{2}:\d{2})/)?.[1] || 'N/A';
          const pickupPoint = Array.from(departureCell.querySelectorAll('p'))
            .find(p => !p.innerText.includes('Giờ đi'))?.innerText.trim() || 'N/A';

          // Arrival time and drop-off point are in <p> tags within the same <td>
          const arrivalCell = columns[2];
          const arrivalTime = arrivalCell.innerText.match(/Giờ đến: (\d{2}:\d{2})/)?.[1] || 'N/A';
          const dropoffPoint = Array.from(arrivalCell.querySelectorAll('p'))
            .find(p => !p.innerText.includes('Giờ đến'))?.innerText.trim() || 'N/A';

          const busType = columns[3]?.innerText.trim() || 'N/A';
          const price = columns[4]?.innerText.trim() || 'N/A';
          const cleanedPrice = price.replace(/[^0-9. VNĐ]/g, '') || 'N/A';

          buses.push({
            source: 'vexe24h.vn',
            startingPoint: 'N/A', // Will be overwritten
            destination: 'N/A',   // Will be overwritten
            operator,
            departureTime,
            pickupPoint,
            arrivalTime,
            dropoffPoint,
            busType,
            price: cleanedPrice
          });
        });

        return buses;
      });

      busData.forEach(bus => {
        bus.startingPoint = startingPoint;
        bus.destination = destination;
      });

      console.log(`vexe24h.vn busData for ${url}:`, busData);
    }

    allBusData.push(...busData);
    await page.close();
  }

  fs.writeFileSync('busData.json', JSON.stringify(allBusData, null, 2));
  console.log('Data saved to busData.json');

  await browser.close();
}

const urls = [
  'https://www.redbus.vn/search?fromCityName=Hồ%20Chí%20Minh%20(Tất%20cả%20các%20điểm)&fromCityId=253239&srcCountry=VNM&toCityName=Bà%20Rịa%20Vũng%20Tàu%20(Tất%20cả%20các%20điểm)&toCityId=195423&destCountry=VNM&onward=12-May-2025&opId=0&busType=Any',
  'https://www.redbus.vn/search?fromCityName=Hồ%20Chí%20Minh%20(Tất%20cả%20các%20điểm)&fromCityId=253239&srcCountry=VNM&toCityName=Sóc%20Trăng%20(Tất%20cả%20các%20điểm)&toCityId=195398&destCountry=VNM&onward=12-May-2025&opId=0&busType=Any',
  'https://www.redbus.vn/search?fromCityName=Hồ%20Chí%20Minh%20(Tất%20cả%20các%20điểm)&fromCityId=253239&srcCountry=VNM&toCityName=Kiên%20Giang%20(Tất%20cả%20các%20điểm)&toCityId=195418&destCountry=VNM&onward=12-May-2025&opId=0&busType=Any',
  'https://www.redbus.vn/search?fromCityName=Hồ%20Chí%20Minh%20(Tất%20cả%20các%20điểm)&fromCityId=253239&srcCountry=VNM&toCityName=Lâm%20Đồng%20(Tất%20cả%20các%20điểm)&toCityId=300612&destCountry=VNM&onward=12-May-2025&opId=0&busType=Any',
  'https://www.redbus.vn/search?fromCityName=Hồ%20Chí%20Minh%20(Tất%20cả%20các%20điểm)&fromCityId=253239&srcCountry=VNM&toCityName=Cà%20Mau%20(Tất%20cả%20các%20điểm)&toCityId=195304&destCountry=VNM&onward=10-May-2025&opId=0&busType=Any',
  'https://www.redbus.vn/search?fromCityName=Hồ%20Chí%20Minh%20(Tất%20cả%20các%20điểm)&fromCityId=253239&srcCountry=VNM&toCityName=Phan%20Thiết%20(Tất%20cả%20các%20điểm)&toCityId=195301&destCountry=VNM&onward=10-May-2025&opId=0&busType=Any',
  'https://www.redbus.vn/search?fromCityName=Hồ%20Chí%20Minh%20(Tất%20cả%20các%20điểm)&fromCityId=253239&srcCountry=VNM&toCityName=Ninh%20Thuận%20(Tất%20cả%20các%20điểm)&toCityId=311961&destCountry=VNM&onward=10-May-2025&opId=0&busType=Any',
  'https://www.redbus.vn/search?fromCityName=Hồ%20Chí%20Minh%20(Tất%20cả%20các%20điểm)&fromCityId=253239&srcCountry=VNM&toCityName=Đà%20Nẵng%20(Tất%20cả%20các%20điểm)&toCityId=297455&destCountry=VNM&onward=12-May-2025&opId=0&busType=Any',
  'https://vexe24h.vn/ve-xe-sai-gon-tphcm-di-vung-tau/',
  'https://vexe24h.vn/ve-xe-sai-gon-tphcm-di-tien-giang/',
  'https://vexe24h.vn/ve-xe-sai-gon-tphcm-di-ben-tre/',
  'https://vexe24h.vn/ve-xe-sai-gon-tphcm-di-kien-giang/',
  'https://vexe24h.vn/ve-xe-sai-gon-tphcm-di-dak-lak/',
  'https://vexe24h.vn/ve-xe-sai-gon-tphcm-di-dong-thap/'
];

crawlBusData(urls).catch(err => console.error(err));