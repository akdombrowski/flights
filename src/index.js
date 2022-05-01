// This is the main Node.js source code file of your actor.
// It is referenced from the "scripts" section of the package.json file,
// so that it can be started by running "npm start".

// Import Apify SDK. For more information, see https://sdk.apify.com/
const Apify = require("apify");
const { log } = Apify.utils;
const Puppeteer = require("puppeteer");

Apify.main(async () => {
  // Get input of the actor (here only for demonstration purposes).
  // If you'd like to have your input checked and have Apify display
  // a user interface for it, add INPUT_SCHEMA.json file to your actor.
  // For more information, see https://docs.apify.com/actors/development/input-schema
  // linkedin company directory page
  const url = "https://www.google.com/travel/flights";

  // see if the user wants to filter by company
  const input = {
    username: "akdombrowski@gmail.com",
    password: process.env.MY_SECRET_PASSWORD,
    companyFilter: "Amazon",
  };
  const username = input.username;
  const password = input.password;
  const companyFilter = input.companyFilter;

  const date = new Date();
  const dateLocale = date.toISOString();
  const logRequest = (interceptedRequest) => {
    if (
      !(
        interceptedRequest.url().includes("gstatic") ||
        interceptedRequest
          .url()
          .endsWith("/log?format=json&hasfast=true&authuser=0")
      )
    ) {
      log.info("");
      log.info("");
      log.info("");
      log.info("A request was made: \n" + interceptedRequest.url());
      log.info("");
      log.info("");
      log.info("");
    }
  };

  try {
    let launchOptions = { headless: false, slowMo: 000, timeout: 60000 };
    let launchContext = {
      launchOptions: launchOptions,
    };

    log.info("");
    log.info("Launching Puppeteer...");
    log.info("");
    // console.log("Launching Puppeteer...");
    const browser = await Apify.launchPuppeteer(launchContext);

    try {
      const page = await browser.newPage();

      log.info(`Opening page ${url}...`);
      const [goToURL] = await Promise.all([
        page.waitForNavigation({
          timeout: 60000,
          waitUntil: "networkidle2",
        }),
        page.goto(url, { timeout: 120000 }),
      ]);
      log.info("goToURL");
      log.info(goToURL[0]);
      log.info("");

      // Get title of the page.
      const title = await page.title();
      log.info(`Title of the page "${url}" is "${title}".`);
      log.info("");

      log.info("Waiting for page loading.");
      log.info("");

      log.info("Finding input fields for beginning and ending locations.");
      log.info("");
      const whereToAncestor = await page.$('[aria-placeholder="Where to?"]');
      const whereFromAncestor = await page.$(
        '[aria-placeholder="Where from?"]'
      );
      const whereTo = await whereToAncestor.$("input");
      const whereFrom = await whereFromAncestor.$("input");

      // start typing Austin
      // you'll get a dropdown of suggestions
      // click the austin, texas suggestion
      log.info("WHERE FROM");
      log.info("Type in the traveling from location.");
      await whereFrom.focus();
      await whereFrom.click();
      log.info("Deleting default value.");
      await whereFrom.press("Backspace");
      await whereFrom.press("Backspace");
      await whereFrom.press("Backspace");
      await whereFrom.press("Backspace");
      await whereFrom.press("Backspace");
      await whereFrom.press("Backspace");
      log.info("Typing in location.");
      await whereFrom.type("Austin", { delay: 00 });
      log.info("Waiting for the right suggestion in the dropdown list.");
      let austinDropdownItem;
      try {
        austinDropdownItem = await page.waitForSelector(
          'li[aria-label="Austin, Texas"]',
          { visible: true }
        );
      } catch (error) {
        log.info("Trying again.");
        log.info(
          "Switch focus to where to input field briefly before switching back."
        );
        await whereTo.focus();
        await whereFrom.focus();
        await whereFrom.press("Backspace");
        austinDropdownItem = await page.waitForSelector(
          'li[aria-label="Austin, Texas"]',
          { visible: true }
        );
      }
      log.info("Click on the suggestion");
      austinDropdownItem
        ? await austinDropdownItem.click()
        : log.error("oops austin isn't in dropdown suggetions");
      // await whereFrom.press("Enter");
      log.info("");

      log.info("WHERE TO");
      log.info("Focus on the 'where to' input field.");
      const clickBox = await whereTo.focus();
      log.info("Typing in travel destination.");
      await whereTo.type("Tokyo", { delay: 000 });
      log.info("Waiting for the right suggestion in the drop down list.");
      const tokyoDropdownItem = await page.waitForSelector(
        'li[aria-label="Tokyo, Japan"]',
        { visible: true }
      );
      log.info("Clicking suggestion.");
      log.info("");
      await tokyoDropdownItem.click();
      // await whereTo.press("Enter");

      log.info("Taking screenshot of filled in input fields.");
      log.info("");
      // Take screenshot of home page
      await page.screenshot({
        path: "./screenshots/aus-tokyo-" + dateLocale + ".png",
        fullPage: true,
      });

      log.info("Looking for 'search' button.");
      const searchBtn = await page.$(
        "button.VfPpkd-LgbsSe.VfPpkd-LgbsSe-OWXEXe-k8QpJ.VfPpkd-LgbsSe-OWXEXe-Bz112c-M1Soyc.nCP5yc.AjY5Oe.qfvgSe.TUT4y"
      );

      log.info("Clicking search button and waiting for navigation.");
      log.info("");
      log.info("Turning on request logging.");
      page.on("request", logRequest);
      const [response1, response2] = await Promise.all([
        page.waitForRequest(
          (request) =>
            request
              .url()
              .startsWith(
                "https://www.google.com/_/TravelFrontendUi/data/travel.frontend.flights.FlightsFrontendService/GetShoppingResults"
              ),
          {
            timeout: 120000,
          }
        ),
        page.waitForRequest(
          (request) =>
            request
              .url()
              .startsWith(
                "https://www.google.com/_/TravelFrontendUi/browserinfo"
              ),
          {
            timeout: 120000,
          }
        ),
        page.waitForRequest(
          (request) =>
            request
              .url()
              .startsWith(
                "https://www.google.com/_/TravelFrontendUi/data/batchexecute?rpcids=WR9Xq&source-path=%2Ftravel%2Fflights%2Fsearch"
              ),
          {
            timeout: 120000,
          }
        ),
        // page.waitForRequest(
        //   (request) =>
        //     request
        //       .url()
        //       .startsWith("https://www.google.com/travel/flights?tfs"),
        //   {
        //     timeout: 600000,
        //   }
        // ),
        page.click(
          "button.VfPpkd-LgbsSe.VfPpkd-LgbsSe-OWXEXe-k8QpJ.VfPpkd-LgbsSe-OWXEXe-Bz112c-M1Soyc.nCP5yc.AjY5Oe.qfvgSe.TUT4y"
        ),
        // page.waitForNavigation(), //{ timeout: 120000, waitUntil: "load" }),
      ]);
      log.info("response1");
      log.info(response1);
      log.info("response2");
      log.info(response2);
      log.info("Turning off request logging.");
      page.off("request", logRequest);
      log.info("");
      log.info("");
      log.info("");

      log.info("Taking screenshot of results page.");
      log.info("");
      // Take screenshot of search results page
      await page.screenshot({
        path: "./screenshots/aus-tokyo-results-" + dateLocale + ".png",
        fullPage: true,
      });

      // Save title to table
      log.info("Saving output...");
      await Apify.setValue("title", {
        title,
      });
    } catch (error) {
      log.error("browser or other error:");
      log.error(error);
    } finally {
      log.info("Closing Puppeteer...");
      await browser.close();

      log.info("Done.");
    }
  } catch (e) {
    log.error("Launch Puppeteer error:");
    log.error(e);
  }
});
