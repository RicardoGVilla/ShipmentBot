const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const locateChrome = require("chrome-location");
puppeteer.use(StealthPlugin());
const axios = require("axios");
const express = require("express");
const app = express();
const port = process.env.PORT || 4000;
const cors = require("cors");

app.use(cors());

// current shipments

const shipments = {
  shipment1: {
    client: "Interandina",
    steamshipLine: "MSC",
    poNumber: "5023-165K",
    product: "wine",
    supplier: "Cargill",
    container: "CRSU6024460",
    eta: "2024-02-15",
    status: "In Transit",
  },
  shipment2: {
    client: "Diser",
    steamshipLine: "MSC",
    poNumber: "5023-162K",
    product: "wine",
    supplier: "Cargill",
    container: "GESU9357858",
    eta: "2024-02-15",
    status: "In Transit",
  },
  shipment3: {
    client: "Diser",
    steamshipLine: "Maersk",
    poNumber: "5023-161K",
    product: "wine",
    supplier: "Cargill",
    container: "SUDU6068809",
    eta: "2024-02-15",
    status: "In Transit",
  },
  shipment4: {
    client: "Interandina",
    poNumber: "5023-164K",
    product: "wine",
    steamshipLine: "Maersk",
    supplier: "Cargill",
    container: "MWCU5295851",
    eta: "2024-02-15",
    status: "In Transit",
  },
  shipment5: {
    client: "AW shipments",
    poNumber: "5023-147K",
    product: "wine",
    steamshipLine: "ONE",
    supplier: "JBS",
    container: "FSCU5886903",
    eta: "2024-02-15",
    status: "In Transit",
  },
  shipment6: {
    client: " poNumberllopez",
    poNumber: "5023-48K",
    product: "wine",
    steamshipLine: "ONE",
    supplier: "JBS",
    container: "SZLU9446927",
    eta: "2024-02-15",
    status: "In Transit",
  },
};

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' 'unsafe-inline' data: http://localhost:9000"
  );
  next();
});

app.get("/api/shipments", (req, res) => {
  res.json(shipments);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});



// Function to track a single shipment
async function trackShipment(shipment) {
  let eta;
  switch (shipment.steamshipLine) {
    case "MSC":
      eta = await runMsc(shipment.container);
      break;
    case "Maersk":
      eta = await runMaersk(shipment.container);
      break;
    case "ONE":
      eta = await runOne(shipment.container);
      break;
    default:
      console.log("Steamship line not supported for tracking");
      eta = "eta Not available";
  }
  shipment.eta = eta;
  console.log(shipment.eta);
}

// Function to automate tracking of all shipments
async function trackShipments() {
  for (const key in shipments) {
    if (shipments.hasOwnProperty(key)) {
      await trackShipment(shipments[key]);
      await delay(60000); // Wait for 1 minute
    }
  }
}

// Function to introduce a delay to avoid getting flagged
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the tracking process
// trackShipments().then(() => console.log("All shipments tracked."));

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

  const searchInputSelector = "#trackingNumber";
  await page.type(searchInputSelector, containerNumber);
  await page.keyboard.press("Enter");

  const selector =
    "body > div.msc-main > div.msc-flow-tracking.separator--bottom-medium > div > div:nth-child(3) > div > div > div > div.msc-flow-tracking__results > div > div > div.msc-flow-tracking__containers > div > div > div.msc-flow-tracking__bar.open > div > div.msc-flow-tracking__cell.msc-flow-tracking__cell--four > div > div > div > span.data-value";

  await page.waitForSelector(selector);
  const element = await page.$(selector);

  let eta = "Not found";
  if (element) {
    eta = await element.evaluate((element) => element.textContent);
  }

  await browser.close();
  return eta;
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

  const selector =
    "#maersk-app > div > div > div > div.container.container--ocean > dl > dd.container-info__text.container-info__text--date";

  await page.waitForSelector(selector);
  let element = await page.$(selector);

  if (element) {
    const text = await page.evaluate((element) => element.textContent, element);
    element = text;
  } else {
    console.log(
      "Element with selector not found for container",
      containerNumber
    );
  }

  await browser.close();
  return element;
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
