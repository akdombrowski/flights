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
        interceptedRequest.url().includes("/log?format=json&hasfast=true")
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
    let launchOptions = {
      headless: true,
      devtools: true,
      // slowMo: 000,
      timeout: 60000,
      dumpio: true,
      defaultViewport: null, //{ width: 1920, height: 1080 },
      args: [
        // "--window-size=1920,1080",
        // '--window-position=0,0',
        "--start-maximized",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-first-run",
        "--no-sandbox",
        "--no-zygote",
        "--proxy-server='direct://'",
        "--proxy-bypass-list=*",
        "--deterministic-fetch",
      ],
    };
    let launchContext = {
      launchOptions: launchOptions,
    };

    log.info("");
    log.info("Launching Puppeteer...");
    log.info("");
    // console.log("Launching Puppeteer...");
    const browser = await Apify.launchPuppeteer(launchContext);

    try {
      // const page = await browser.newPage();
      // get existing tab/page (first item in the array)
      var [page] = await browser.pages();

      log.info(`Opening page ${url}...`);
      const [goToURL] = await Promise.all([
        page.waitForNavigation({
          timeout: 60000,
          waitUntil: "networkidle2",
        }),
        page.goto(url, { timeout: 60000 }),
      ]);
      // log.info("goToURL");
      // log.info(goToURL);
      // log.info("");

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
          { visible: true, timeout: 1000 }
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
          { visible: true, timeout: 1000 }
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
        { visible: true, timeout: 1000 }
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
      await page.$(
        "button.VfPpkd-LgbsSe.VfPpkd-LgbsSe-OWXEXe-k8QpJ.VfPpkd-LgbsSe-OWXEXe-Bz112c-M1Soyc.nCP5yc.AjY5Oe.qfvgSe.TUT4y"
      );

      log.info("Clicking search button and waiting for navigation.");
      log.info("");
      log.info("");
      log.info("");

      // DEBUG: this was used to watch requests. since waitForNavigation wasn't working, I had to figure out which requests were the ones needed to load the search results.
      log.info("Turning on request logging.");
      page.on("request", logRequest);
      log.info("");
      log.info("");
      log.info("");

      // There seem to be 3 important requests we need to wait for to see the results page be loaded.
      const [response1, response2, response3] = await Promise.all([
        page.waitForRequest(
          (request) =>
            request
              .url()
              .startsWith(
                "https://www.google.com/_/TravelFrontendUi/data/travel.frontend.flights.FlightsFrontendService/GetShoppingResults"
              ),
          {
            timeout: 5000,
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
            timeout: 5000,
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
            timeout: 5000,
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

        // page.waitForNavigation({
        //   timeout: 120000,
        //   waitUntil: "domcontentloaded",
        // }),

        page.click(
          "button.VfPpkd-LgbsSe.VfPpkd-LgbsSe-OWXEXe-k8QpJ.VfPpkd-LgbsSe-OWXEXe-Bz112c-M1Soyc.nCP5yc.AjY5Oe.qfvgSe.TUT4y"
        ),
      ]);

      // // log.info("response1");
      // // Note: cache should not be re-used by repeated calls to JSON.stringify.
      // let cache = [];
      // const response1JSONified = JSON.stringify(response1, (key, value) => {
      //   if (value === null) {
      //     return;
      //   }

      //   if (typeof value === "object" && value !== null) {
      //     // Duplicate reference found, discard key
      //     if (cache.includes(value)) return;

      //     // Store value in our collection
      //     cache.push(value);
      //   }
      //   return value;
      // });
      // // log.info(response1JSONified);
      // cache = null; // Enable garbage collection

      // // log.info("");
      // // log.info("");
      // // log.info("");
      // // log.info("response2");
      // // Note: cache should not be re-used by repeated calls to JSON.stringify.
      // cache = [];
      // let response2JSONified = JSON.stringify(response2, (key, value) => {
      //   if (value === null) {
      //     return;
      //   }

      //   if (typeof value === "object" && value !== null) {
      //     // Duplicate reference found, discard key
      //     if (cache.includes(value)) return;

      //     // Store value in our collection
      //     cache.push(value);
      //   }

      //   return value;
      // });
      // // log.info(response2JSONified);
      // cache = null;

      log.info("Turning off request logging.");
      page.off("request", logRequest);
      log.info("");

      log.info("Taking screenshot of results page.");
      log.info("");
      // Take screenshot of search results page
      await page.screenshot({
        path: "./screenshots/aus-tokyo-results-" + dateLocale + ".png",
        fullPage: true,
      });

      log.info("");
      log.info("");
      log.info("");
      log.info("Scraping prices...");
      const flights = await page.$$("[role=listitem]");
      let flightInfos = new Array();
      for (let flight of flights) {
        const theMoreBtn = await flight.$(".zISZ5c.QB2Jof");
        if (theMoreBtn !== null) {
          log.info("the more button was found");
          // if we found the btn, aka it querySelector didn't return null,
          // then this is the row contains the "more" button or the button
          // that expands the search results.
          // we want to continue to the next iteration of the for loop or
          // exit out of it if we've reached the end.
          continue;
        }

        log.info("the more button wasn't found. proceeding.");

        const data = new Object();

        // tip for future, they use .YMlIz.FpEdX.jLMuyc when
        // it's a better than typical fare, ie, when the
        // price shows in green in the UI
        const price = await flight.$eval(
          ".YMlIz.FpEdX > span",
          (node) => node.innerText
        );
        data.price = price;

        // const airline = await flight.$$(
        //   ".TQqf0e.sSHqwe.tPgKwe.ogfYpf > span");
        const airline = await flight.$$eval(
          ".TQqf0e.sSHqwe.tPgKwe.ogfYpf span",
          (nodes) =>
            nodes.map((node, i) => {
              if (i !== 1) return node.innerText;
            })
        );
        airline.splice(1, 1);
        const airlineText = Object.values(airline);
        const airlineName =
          airlineText.length > 1
            ? airlineText[0] + " " + airlineText[1]
            : airlineText[0];
        log.info("airline");
        log.info(airlineName);
        data.airline = airlineName;

        const times = await flight.$$eval(
          ".zxVSec.YMlIz.tPgKwe.ogfYpf > .mv1WYe [role=text]",
          (nodes) => nodes.map((node) => node.innerText)
        );
        log.info("times");
        log.info(times);
        data.departureTime = times[0];
        data.arrivalTime = times[1];

        log.info(JSON.stringify(data));
        flightInfos.push(data);
      }

      log.info("flightInfos");
      for (let f of flightInfos) {
        log.info(JSON.stringify(f));
      }
      // Write flights to datastore
      await Apify.pushData(flightInfos);
      log.info("");
      log.info("");
      log.info("");

      // Save title to table
      log.info("Saving output...");
      await Apify.setValue("title", {
        title,
      });
      // await Apify.pushData({
      //   response1: response1JSONified,
      //   response2: response2JSONified,
      // });
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
