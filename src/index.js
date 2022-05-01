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
      log.debug("");
      log.debug("");
      log.debug("");
      log.debug("A request was made: \n" + interceptedRequest.url());
      log.debug("");
      log.debug("");
      log.debug("");
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
        // "--start-maximized",
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

    log.debug("");
    log.debug("Launching Puppeteer...");
    log.debug("");
    // console.log("Launching Puppeteer...");
    const browser = await Apify.launchPuppeteer(launchContext);

    try {
      // const page = await browser.newPage();
      // get existing tab/page (first item in the array)
      var [page] = await browser.pages();

      log.debug(`Opening page ${url}...`);
      const [goToURL] = await Promise.all([
        page.waitForNavigation({
          timeout: 60000,
          waitUntil: "networkidle2",
        }),
        page.goto(url, { timeout: 60000 }),
      ]);
      // log.debug("goToURL");
      // log.debug(goToURL);
      // log.debug("");

      // Get title of the page.
      const title = await page.title();
      log.debug(`Title of the page "${url}" is "${title}".`);
      log.debug("");

      log.debug("Waiting for page loading.");
      log.debug("");

      log.debug("Finding input fields for beginning and ending locations.");
      log.debug("");
      const whereToAncestor = await page.$('[aria-placeholder="Where to?"]');
      const whereFromAncestor = await page.$(
        '[aria-placeholder="Where from?"]'
      );
      const whereTo = await whereToAncestor.$("input");
      const whereFrom = await whereFromAncestor.$("input");

      // start typing Austin
      // you'll get a dropdown of suggestions
      // click the austin, texas suggestion
      log.debug("WHERE FROM");
      log.debug("Type in the traveling from location.");
      await whereFrom.focus();
      await whereFrom.click();
      log.debug("Deleting default value.");
      await whereFrom.press("Backspace");
      await whereFrom.press("Backspace");
      await whereFrom.press("Backspace");
      await whereFrom.press("Backspace");
      await whereFrom.press("Backspace");
      await whereFrom.press("Backspace");
      log.debug("Typing in location.");
      await whereFrom.type("Austin", { delay: 00 });
      log.debug("Waiting for the right suggestion in the dropdown list.");
      let austinDropdownItem;
      try {
        austinDropdownItem = await page.waitForSelector(
          'li[aria-label="Austin, Texas"]',
          { visible: true, timeout: 10000 }
        );
      } catch (error) {
        log.debug("Trying again.");
        log.debug(
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
      log.debug("Click on the suggestion");
      austinDropdownItem
        ? await austinDropdownItem.click()
        : log.error("oops austin isn't in dropdown suggetions");
      // await whereFrom.press("Enter");
      log.debug("");

      log.debug("WHERE TO");
      log.debug("Focus on the 'where to' input field.");
      const clickBox = await whereTo.focus();
      log.debug("Typing in travel destination.");
      await whereTo.type("Tokyo", { delay: 000 });
      log.debug("Waiting for the right suggestion in the drop down list.");
      const tokyoDropdownItem = await page.waitForSelector(
        'li[aria-label="Tokyo, Japan"]',
        { visible: true, timeout: 1000 }
      );
      log.debug("Clicking suggestion.");
      log.debug("");
      await tokyoDropdownItem.click();
      // await whereTo.press("Enter");

      log.debug("Taking screenshot of filled in input fields.");
      log.debug("");
      // Take screenshot of home page
      await page.screenshot({
        path: "./screenshots/aus-tokyo-" + dateLocale + ".png",
        fullPage: true,
      });

      log.debug("Looking for 'search' button.");
      await page.$(
        "button.VfPpkd-LgbsSe.VfPpkd-LgbsSe-OWXEXe-k8QpJ.VfPpkd-LgbsSe-OWXEXe-Bz112c-M1Soyc.nCP5yc.AjY5Oe.qfvgSe.TUT4y"
      );

      log.debug("Clicking search button and waiting for navigation.");
      log.debug("");
      log.debug("");
      log.debug("");

      // DEBUG: this was used to watch requests. since waitForNavigation wasn't working, I had to figure out which requests were the ones needed to load the search results.
      log.debug("Turning on request logging.");
      page.on("request", logRequest);
      log.debug("");
      log.debug("");
      log.debug("");

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

      // // log.debug("response1");
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
      // // log.debug(response1JSONified);
      // cache = null; // Enable garbage collection

      // // log.debug("");
      // // log.debug("");
      // // log.debug("");
      // // log.debug("response2");
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
      // // log.debug(response2JSONified);
      // cache = null;

      log.debug("Turning off request logging.");
      page.off("request", logRequest);
      log.debug("");

      log.debug("Taking screenshot of results page.");
      log.debug("");
      // Take screenshot of search results page
      await page.screenshot({
        path: "./screenshots/aus-tokyo-results-" + dateLocale + ".png",
        fullPage: true,
      });

      log.debug("");
      log.debug("");
      log.debug("");
      log.debug("Scraping prices...");
      log.debug("attempting to scroll through all results");
      await Apify.utils.puppeteer.infiniteScroll(page, {
        timeoutSecs: 30,
        waitForSecs: 5,
        scrollDownAndUp: true,
        buttonSelector: "[role=listitem] .zISZ5c.QB2Jof",
      });
      const flights = await page.$$("[role=listitem]");
      let flightInfos = new Array();
      for (let flight of flights) {
        const theMoreBtn = await flight.$(".zISZ5c.QB2Jof");
        if (theMoreBtn !== null) {
          log.debug("the more button was found");
          // if we found the btn, aka it querySelector didn't return null,
          // then this is the row contains the "more" button or the button
          // that expands the search results.
          // we want to continue to the next iteration of the for loop or
          // exit out of it if we've reached the end.
          continue;
        }

        log.debug("the more button wasn't found. proceeding.");

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
        log.debug("airline");
        log.debug(airlineName);
        data.airline = airlineName;

        const times = await flight.$$eval(
          ".zxVSec.YMlIz.tPgKwe.ogfYpf > .mv1WYe [role=text]",
          (nodes) => nodes.map((node) => node.innerText)
        );
        log.debug("times");
        log.debug(times);
        data.departureTime = times[0];
        data.arrivalTime = times[1];

        log.debug(JSON.stringify(data));
        flightInfos.push(data);
      }

      log.debug("flightInfos");
      for (let f of flightInfos) {
        log.debug(JSON.stringify(f));
      }
      // Write flights to datastore
      await Apify.pushData(flightInfos);
      log.debug("");
      log.debug("");
      log.debug("");

      // Save title to table
      log.debug("Saving output...");
      log.debug("");
      await Apify.setValue("title", {
        title,
      });
      // await Apify.pushData({
      //   response1: response1JSONified,
      //   response2: response2JSONified,
      // });
    } catch (error) {
      log.error("");
      log.error("browser or other error:");
      log.error(error);
      log.error("");
      log.error("");
      log.error("");
    } finally {
      log.debug("Closing Puppeteer...");
      log.debug("");
      await browser.close();

      log.debug("Done.");
      log.debug("");
      log.debug("");
      log.debug("");
    }
  } catch (e) {
    log.error("");
    log.error("Launch Puppeteer error:");
    log.error(e);
    log.error("");
    log.error("");
    log.error("");
  }
});
