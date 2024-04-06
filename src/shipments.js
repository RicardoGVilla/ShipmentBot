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
        console.log(eta);
        if (!eta) {
          console.log("No ETA was retrieved for this shipment.");
        } else {
          console.log(`ETA for container ${shipment.container}: ${eta}`);
        }
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
            await updateShipment(newShipment.container, latestEta);
          }
        } else {
          const eta = await trackShipment(newShipment);
          await updateShipment(newShipment.container, eta);
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
  return formattedDate;
}

//Function to track ONE shipments
// async function runOne(containerNumber) {
//   const browser = await puppeteer.launch({
//     headless: false,
//     executablePath: locateChrome,
//   });

//   const page = await browser.newPage();
//   const trackingUrl = `https://ecomm.one-line.com/one-ecom/manage-shipment/cargo-tracking?redir=Y&ctrack-field=${containerNumber}&sessLocale=en&trakNoParam=${containerNumber}`;

//   await page.goto(trackingUrl);

//   const iframeSelector = "#IframeCurrentEcom";
//   await page.waitForSelector(iframeSelector);

//   const frame = await page.$(iframeSelector);

//   const frameContent = await frame.evaluate(() => document.body.innerHTML);
//   console.log(frameContent);

  // // Get the iframe content frame
  // const frame = await elementHandle.contentFrame();
  // console.log(frame);

  // For example, to get the body HTML of the iframe you can do:
  // const bodyHTML = await frame.evaluate(() => document.body.innerHTML);

  // console.log(bodyHTML);

  // etaSelector = "#sailing > tbody > tr > td:nth-child(5)";
  // await page.waitForSelector(etaSelector);
  // dateText = insideDoc.querySelector(etaSelector);
  // console.log(dateText);

  // await page.waitForSelector(selector, { visible: true });

  // const dateText = await page.evaluate((selector) => {
  //   return document.querySelector(selector).innerText;
  // }, selector);

  // console.log(dateText)

  // const elementInsideIframe = await iframe.$(elementInsideIframeSelector);
  // console.log(elementInsideIframe);

  // let eta = "";

  // if (elementInsideIframe) {
  //   const textContent = await iframe.evaluate(
  //     (element) => element.textContent,
  //     elementInsideIframe
  //   );

  //   // Parse the date and format it using moment
  //   const dateMatch = textContent.match(/\d{4}-\d{2}-\d{2}/); // Assuming date is in 'yyyy-MM-dd' format
  //   if (dateMatch) {
  //     const formattedDate = moment(dateMatch[0]).format("D MMMM YYYY");
  //     eta = formattedDate;
  //   } else {
  //     console.log(
  //       "Date not found in the expected format for container",
  //       containerNumber
  //     );
  //   }
  // } else {
  //   console.log(
  //     "Element inside iframe not found for container",
  //     containerNumber
  //   );
  // }

  // await browser.close();
  // console.log(eta);
  // return eta;
// }

//Function to track Maersk shipments
// async function runMaersk(containerNumber) {
//   const browser = await puppeteer.launch({
//     headless: false,
//     executablePath: locateChrome,
//   });
//   const page = await browser.newPage();
//   const trackingUrl = `https://www.maersk.com/tracking/${containerNumber}`;

//   await page.goto(trackingUrl);

//   const selector =
//     "#maersk-app > div > div > div > div.container.container--ocean > dl > dd.container-info__text.container-info__text--date";

//   await page.waitForSelector(selector);
//   let etaElement = await page.$(selector);

//   let eta = "Not found"; // Default value in case of an error
//   if (etaElement) {
//     const text = await page.evaluate(
//       (element) => element.textContent,
//       etaElement
//     );
//     eta = moment(text.trim(), "DD MMM YYYY HH:mm").format("DD MMM YYYY");
//   } else {
//     console.log(
//       "Element with selector not found for container",
//       containerNumber
//     );
//   }

//   await browser.close();
//   return eta;
// }

async function runHapagLloyd(containerNumber) {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: locateChrome,
  });

  const page = await browser.newPage();
 
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/" +
    (Math.floor(Math.random() * 100) + 80) +
    ".0.0.0 Safari/537.36";


  await page.setUserAgent(userAgent);

  await page.goto(
    `https://www.hapag-lloyd.com/en/home.html`
    // `https://www.hapag-lloyd.com/en/online-business/track/track-by-container-solution.html?container=${containerNumber}`
  );

  // await browser.close();
}
