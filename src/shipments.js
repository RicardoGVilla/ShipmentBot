const puppeteer = require("puppeteer-extra");
const moment = require("moment");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const locateChrome = require("chrome-location");
puppeteer.use(StealthPlugin());
const {
  getShipments,
  isDatabaseEmpty,
  insertShipments,
  updateOrInsertShipment,
  removeAllShipments,
} = require("./mongodb");
const shipments = require("./shipmentdetails");

// Function to track a single shipment
async function trackShipment(shipment) {
  try {
    let eta;
    switch (shipment.steamshipLine) {
      case "MSC":
        eta = await runMsc(shipment.container);
        break;
      case "Maersk":
        eta = await runMaersk(shipment.container);
        break;
      case "HAPAG":
        eta = await runHapagLloyd(shipment.container);
        break;
      case "ONE":
        eta = await runOne(shipment.container);
        break;
      default:
        console.log("Steamship line not supported for tracking");
        eta = null;
    }

    // If a new ETA was found, return it
    if (eta) return eta;

    // If not, use the existing ETA from the database
    const shipmentsFromDB = await getShipments();
    const existingShipment = shipmentsFromDB.find(
      (s) => s.container === shipment.container
    );
    return existingShipment ? existingShipment.eta : shipment.eta;
  } catch (error) {
    console.error(
      `Error tracking shipment for container ${shipment.container}: ${error}`
    );
    // In case of any error, return the latest ETA from the database
    const shipmentsFromDB = await getShipments();
    const existingShipment = shipmentsFromDB.find(
      (s) => s.container === shipment.container
    );
    return existingShipment ? existingShipment.eta : shipment.eta;
  }
}

// Function to automate tracking of all shipments
async function trackShipments() {
  const empty = await isDatabaseEmpty();

  if (empty) {
    await insertShipments(shipments);
    console.log("All shipments inserted into the database.");
  } else {
    const shipmentsFromDB = await getShipments();

    for (const key in shipments) {
      if (shipments.hasOwnProperty(key)) {
        const newShipment = shipments[key];
        const existingShipment = shipmentsFromDB.find(
          (s) => s.container === newShipment.container
        );

        if (existingShipment) {
          const latestEta = await trackShipment(newShipment);
          if (latestEta !== existingShipment.eta) {
            await updateOrInsertShipment(newShipment.container, latestEta); 
          }
        } else {
          const eta = await trackShipment(newShipment);
          await updateOrInsertShipment(newShipment.container, eta); 
        }
        // add a delay of 30 seconds between function calls
        await delay(30000);
      }
    }

    console.log("All shipments tracked and updated in the database.");
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

trackShipments()
  .then(() => console.log("All shipments processed."))
  .catch((error) => console.error("An error occurred:", error));

// Function to run MSC shipments
async function runMsc(containerNumber) {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: locateChrome,
  });

  const page = await browser.newPage();
  await page.goto(
    "https://www.msc.com/en/track-a-shipment?__RequestVerificationToken=token1&trackingMode=1"
  );

  const cookiesInputSelector = "#onetrust-accept-btn-handler";
  await page.waitForSelector(cookiesInputSelector, { visible: true });
  await page.click(cookiesInputSelector);

  const searchInputSelector = "#trackingNumber";
  await page.waitForSelector(searchInputSelector, { visible: true });
  await page.type(searchInputSelector, containerNumber);
  await page.keyboard.press("Enter");

  const selector =
    "body > div.msc-main > div.msc-flow-tracking.separator--bottom-medium > div > div:nth-child(3) > div > div > div > div.msc-flow-tracking__results > div > div > div.msc-flow-tracking__containers > div > div > div.msc-flow-tracking__bar.open > div > div.msc-flow-tracking__cell.msc-flow-tracking__cell--four > div > div > div > span.data-value";

  await page.waitForSelector(selector, { visible: true });

  const dateText = await page.evaluate((selector) => {
    return document.querySelector(selector).innerText;
  }, selector);

  const formattedDate = moment(dateText, "DD/MM/YYYY").format("D MMMM YYYY");

  await browser.close();
  console.log(`MSC: ETA for container ${formattedDate}`);
  return formattedDate;
}

//Function to track ONE shipments
async function runOne(containerNumber) {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: locateChrome,
  });

  const page = await browser.newPage();
  const trackingUrl = `https://ecomm.one-line.com/one-ecom/manage-shipment/cargo-tracking?redir=Y&ctrack-field=${containerNumber}&sessLocale=en&trakNoParam=${containerNumber}`;

  await page.goto(trackingUrl);

  const iframeSelector = "#IframeCurrentEcom";
  await page.waitForSelector(iframeSelector);
  const iframeElement = await page.$(iframeSelector);
  await page.waitForTimeout(2000);
  const iframe = await iframeElement.contentFrame();

  const elementInsideIframeSelector =
    "#detail > tbody > tr:nth-child(10) > td:nth-child(4)";
  const elementInsideIframe = await iframe.$(elementInsideIframeSelector);

  let eta = "";

  if (elementInsideIframe) {
    const textContent = await iframe.evaluate(
      (element) => element.textContent,
      elementInsideIframe
    );
    eta = textContent;
  } else {
    console.log(
      "Element inside iframe not found for container",
      containerNumber
    );
  }

  await browser.close();
  return eta;
}

//Function to track Maersk shipments
async function runMaersk(containerNumber) {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: locateChrome,
  });
  const page = await browser.newPage();
  const trackingUrl = `https://www.maersk.com/tracking/${containerNumber}`;

  await page.goto(trackingUrl);

  const cookiesInputSelector =
    "#coiPage-1 > div.coi-banner__page-footer > button.coi-banner__accept.coi-banner__accept--fixed-margin";
  await page.waitForSelector(cookiesInputSelector);
  await page.click(cookiesInputSelector);

  const selector =
    "#maersk-app > div > div > div.container.container--ocean > dl > dd.container-info__text.container-info__text--date";

  await page.waitForSelector(selector);

  const dateText = await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element ? element.textContent : null;
  }, selector);

  const parsedDate = moment(dateText, "DD MMM YYYY HH:mm");

  const formattedDate = parsedDate.format("D MMMM YYYY");

  console.log(formattedDate);

  return formattedDate;
}
