const puppeteer = require("puppeteer-extra");
const moment = require("moment");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const locateChrome = require("chrome-location");
puppeteer.use(StealthPlugin());
const {
  getShipments,
  isDatabaseEmpty,
  insertShipments,
  updateShipment,
} = require("./mongodb");
const shipments = require("./shipmentdetails");


// Function to track a single shipment
async function trackShipment(shipment) {
  try {
    let eta;
    switch (shipment.steamshipLine) {
      case "MSC":
        eta = await runMsc(shipment.container);
        if (!eta) {
          console.log("No ETA was retrieved for this shipment.");
        } else {
          console.log(`ETA for container ${shipment.container}: ${eta}`);
        }
        break;
      // case "Maersk":
      //   eta = await runMaersk(shipment.container);
      //   break;
      // case "ONE":
      //   eta = await runOne(shipment.container);
      //   break;
      default:
        console.log("Steamship line not supported for tracking");
        eta = null; // Use null to indicate no new ETA was found
    }
    
    // If a new ETA was found, return it
    if (eta) return eta;

    // If not, use the existing ETA from the database
    const shipmentsFromDB = await getShipments();
    const existingShipment = shipmentsFromDB.find(s => s.container === shipment.container);
    return existingShipment ? existingShipment.eta : shipment.eta;
  } catch (error) {
    console.error(`Error tracking shipment for container ${shipment.container}: ${error}`);
    // In case of any error, return the latest ETA from the database
    const shipmentsFromDB = await getShipments();
    const existingShipment = shipmentsFromDB.find(s => s.container === shipment.container);
    return existingShipment ? existingShipment.eta : shipment.eta;
  }
}



// Function to automate tracking of all shipments
async function trackShipments() {
  // Check if the database is empty
  const empty = await isDatabaseEmpty();

  if (empty) {
    // Insert all shipments if the database is empty
    await insertShipments(shipments);
    console.log("All shipments inserted into the database.");
  } else {
    // If the database is not empty, update shipments with changed ETAs
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
            // Update shipment in database
            await updateShipment(newShipment.container, latestEta);
          }
        }

        await delay(60000); // Wait for 1 minute between tracking requests
      }
    }

    console.log("All shipments tracked and updated in the database.");
  }
}

// Function to introduce a delay to avoid getting flagged
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the tracking process
trackShipments()
  .then(() => console.log("All shipments processed."))
  .catch((error) => console.error("An error occurred:", error));


// Function to help track all MSC shipments
async function runMsc(containerNumber) {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: locateChrome,
  });

  const page = await browser.newPage();
  await page.goto(
    "https://www.msc.com/en/track-a-shipment?__RequestVerificationToken=token1&trackingMode=1"
  );

  // Accept cookies if necessary
  const cookiesInputSelector = "#onetrust-accept-btn-handler";
  await page.waitForSelector(cookiesInputSelector, { visible: true });
  await page.click(cookiesInputSelector);

  // Type the container number and press Enter
  const searchInputSelector = "#trackingNumber";
  await page.waitForSelector(searchInputSelector, { visible: true });
  await page.type(searchInputSelector, containerNumber);
  await page.keyboard.press("Enter");

  // Define the selector for the element that contains the information you want to extract
  const selector =
    "body > div.msc-main > div.msc-flow-tracking.separator--bottom-medium > div > div:nth-child(3) > div > div > div > div.msc-flow-tracking__results > div > div > div.msc-flow-tracking__containers > div > div > div.msc-flow-tracking__tracking > div.msc-flow-tracking__steps > div:nth-child(2) > div > div.msc-flow-tracking__cell.msc-flow-tracking__cell--two";
  await page.waitForSelector(selector, { visible: true });

  // Extract the text from the element
  const text = await page.evaluate((selector) => {
    return document.querySelector(selector).innerText;
  }, selector);

  console.log(text); // This will output the text content of the selected element

  // Rest of your code to extract other information if necessary

  await browser.close();
  return text;
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

  // await browser.close();
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

  const selector =
    "#maersk-app > div > div > div > div.container.container--ocean > dl > dd.container-info__text.container-info__text--date";

  await page.waitForSelector(selector);
  let etaElement = await page.$(selector);

  let eta = "Not found"; // Default value in case of an error
  if (etaElement) {
    const text = await page.evaluate(
      (element) => element.textContent,
      etaElement
    );
    eta = moment(text.trim(), "DD MMM YYYY HH:mm").format("DD MMM YYYY");
  } else {
    console.log(
      "Element with selector not found for container",
      containerNumber
    );
  }

  await browser.close();
  return eta; // This will now return the date in '30 Jan 2024' format.
}


async function runHapagLloyd(containerNumber) {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: locateChrome,
  });

  const page = await browser.newPage();
  await page.setBypassCSP(true);

  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/" +
    Math.floor(Math.random() * 100 + 60) +
    ".0.0.0 Safari/537.36";
  await page.setUserAgent(userAgent);

  await page.goto(
    `https://www.hapag-lloyd.com/en/online-business/track/track-by-container-solution.html?container=${containerNumber}`
  );

  await browser.close();
}

