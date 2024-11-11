const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json'));

const { interval, location, checkIn, checkOut } = config.scraping;


async function scrapeAirbnb(location, checkIn, checkOut) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    console.log('Starting the scraping process...\n');


    const url = `https://www.airbnb.com/s/${encodeURIComponent(location)}/homes?checkin=${checkIn}&checkout=${checkOut}&locale=en`;
    console.log(`Navigating to URL: ${url}\n`);


    await page.goto(url, { waitUntil: 'networkidle2' });

    const content = await page.content();
    const $ = cheerio.load(content);

    const listings = [];
    console.log('Scraping listings...\n');


    $('div[itemprop="itemListElement"]').each((index, element) => {
        const title = $(element).find('meta[itemprop="name"]').attr('content');
        const url = $(element).find('meta[itemprop="url"]').attr('content');
        const price = $(element).find('span._11jcbg2').text().trim();

        listings.push({ title, url, price });
    });


    await browser.close();

    return listings;
}

function runScraping() {
    scrapeAirbnb(location, checkIn, checkOut)
        .then(results => {
            console.log('-----------------------------------');
            console.log(JSON.stringify(results, null, 2));
            console.log(`\nTotal listings scraped: ${results.length}\n`);
            console.log('Scraping process completed.\n');
        })
        .catch(error => {
            console.error('Error during scraping:', error);
        });
};

runScraping();
setInterval(runScraping, interval * 1000);
console.log(`Scraping set up to run every ${interval} seconds.`);
