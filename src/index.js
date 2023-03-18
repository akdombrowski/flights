// This is the main Node.js source code file of your actor.
// It is referenced from the "scripts" section of the package.json file,
// so that it can be started by running "npm start".

// Import Apify SDK. For more information, see https://sdk.apify.com/
const Apify = require("apify");
const { log } = Apify.utils;
const Puppeteer = require("puppeteer");

const clickSearchAndWaitForResults = async (page) => {
  return await Promise.all([
    page.waitForRequest(
      (request) =>
        request
          .url()
          .startsWith(
            "https://www.google.com/_/TravelFrontendUi/data/travel.frontend.flights.FlightsFrontendService/GetShoppingResults"
          ),
      {
        timeout: 15000,
      }
    ),
    page.waitForRequest(
      (request) =>
        request
          .url()
          .startsWith("https://www.google.com/_/TravelFrontendUi/browserinfo"),
      {
        timeout: 15000,
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
        timeout: 15000,
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
};
const waitForSearchResults = async (page) => {
  return await Promise.all([
    page.waitForRequest(
      (request) =>
        request
          .url()
          .startsWith(
            "https://www.google.com/_/TravelFrontendUi/data/travel.frontend.flights.FlightsFrontendService/GetShoppingResults"
          ),
      {
        timeout: 15000,
      }
    ),
    page.waitForRequest(
      (request) =>
        request
          .url()
          .startsWith("https://www.google.com/_/TravelFrontendUi/browserinfo"),
      {
        timeout: 15000,
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
        timeout: 15000,
      }
    ),
  ]);
};

Apify.main(async () => {
  // Get input of the actor (here only for demonstration purposes).
  // If you'd like to have your input checked and have Apify display
  // a user interface for it, add INPUT_SCHEMA.json file to your actor.
  // For more information, see https://docs.apify.com/actors/development/input-schema
  // linkedin company directory page
  const url = "https://www.google.com/travel/flights";

  // eventually convert to user input
  // classes available: economy, premium econom, business, first class.
  const input = {
    departCity: "LAX",
    arriveCity: "Tokyo",
    cabinClass: "economy",
    departureDate: "Dec 4, 2023",
    returnDate: "Dec 20, 2023",
  };
  const departCity = input.departCity;
  const arriveCity = input.arriveCity;
  const cabinClass = input.cabinClass;
  const departureDate = input.departureDate;
  const returnDate = input.returnDate;

  const logRequest = (interceptedRequest) => {
    if (
      !(
        interceptedRequest.url().includes("gstatic") ||
        interceptedRequest.url().includes("/log?format=json&hasfast=true")
      )
    ) {
      log.debug("");
      log.debug("");
      log.debug("A request was made: \n" + interceptedRequest.url());
      log.debug("");
      log.debug("");
    }
  };

  try {
    let launchOptions = {
      headless: false,
      // executablePath: "/usr/bin/google-chrome-stable",
      devtools: true,
      slowMo: 00,
      timeout: 15000,
      dumpio: true,
      defaultViewport: null, //{ width: 1920, height: 1080 },
      args: [
        // "--window-size=1920,1080",
        // '--window-position=0,0',
        "--start-maximized",
        "--use-gl=egl",
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
      // ignoreDefaultArgs: ["--disable-extensions"],
    };
    let launchContext = {
      launchOptions: launchOptions,
    };

    log.debug("");
    log.debug("Launching Puppeteer...");
    log.debug("");

    const browser = await Apify.launchPuppeteer(launchContext);

    try {
      // const page = await browser.newPage();
      // get existing tab/page (first item in the array)
      var [page] = await browser.pages();

      page.on("pageerror", (err) => {
        log.error(err);
      });

      log.debug("");
      log.debug(`Opening page ${url}...`);
      log.debug("");
      const [goToURL] = await Promise.all([
        page.waitForNavigation({
          timeout: 60000,
          waitUntil: "networkidle2",
        }),
        page.goto(url, { timeout: 60000 }),
      ]);
      // log.debug("");
      // log.debug(goToURL);
      // log.debug("");

      // Get title of the page.
      const title = await page.title();
      log.debug("");
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

      // start typing departCty
      // you'll get a dropdown of suggestions
      // click the first suggestion
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
      await whereFrom.type(departCity, { delay: 00 });
      log.debug("Waiting for the right suggestion in the dropdown list.");

      let firstDepartCitySuggestion;
      let t = 0;
      while (!firstDepartCitySuggestion && t < 100) {
        try {
          firstDepartCitySuggestion = await page.waitForSelector("li.n4HaVc", {
            visible: true,
            timeout: 5000,
          });
        } catch (error) {
          log.debug("Trying again.");
          log.debug(
            "Switch focus to where to input field briefly before switching back."
          );
          await whereTo.focus();
          await whereFrom.focus();
          await whereFrom.press("Backspace");
          await whereFrom.type(departCity, { delay: 00 });
        } finally {
          t++;
        }
      }

      // click it!
      log.debug("Click on the suggestion");
      firstDepartCitySuggestion
        ? await firstDepartCitySuggestion.click()
        : log.error("oops not seeing suggestions");
      // await whereFrom.press("Enter");
      log.debug("");

      //
      // WHERE TO INPUT
      //
      log.debug("WHERE TO");
      log.debug("Focus on the 'where to' input field.");
      const clickBox = await whereTo.focus();
      log.debug("Typing in travel destination.");
      await whereTo.type(arriveCity, { delay: 000 });
      log.debug("Waiting for the right suggestion in the drop down list.");
      const firstArriveCitySuggestion = await page.waitForSelector(
        "li.n4HaVc.sMVRZe.pIWVuc",
        { visible: true, timeout: 60000 }
      );
      log.debug("Clicking suggestion.");
      log.debug("");
      await firstArriveCitySuggestion.click();

      //
      //
      //
      //  Date Input
      //
      //
      //
      //
      //
      //
      //
      //
      log.debug("DEPARTURE DATE");
      log.debug("Focus on 'departure date' input field.");
      const departureInput = await page.$("input[placeholder=Departure");
      await departureInput.focus();
      log.debug("Typing in date.");
      // await departureInput.type(departureDate, { delay: 100 });
      await departureInput.evaluate((node, departureDate) => {
        node.value = departureDate;
      }, departureDate);
      log.debug("Typed in departure date.");
      const depDate = await departureInput.evaluate((node) => node.value);
      log.debug("");
      log.debug("");
      log.debug("");
      log.debug("depDate");
      log.debug(depDate);
      log.debug("");
      log.debug("");
      log.debug("");
      log.debug("Hitting enter.");
      await departureInput.press("Enter");
      log.debug("Hit enter.");

      log.debug("RETURN DATE");
      log.debug("Focus on 'return date' input field.");
      const returnInput = await page.$("input[placeholder=Return");
      await returnInput.focus();
      log.debug("Typing in date.");
      // await departureInput.type(departureDate, { delay: 100 });
      await returnInput.evaluate((node, returnDate) => {
        node.value = returnDate;
      }, returnDate);
      log.debug("Typed in return date.");
      log.debug("Hitting enter.");
      await returnInput.press("Enter");
      log.debug("Hit enter.");

      //
      //
      //
      //  Cabin Class
      //
      //
      //
      //
      //
      //
      //
      //

      //
      // Screenshot
      //
      const date = new Date();
      const dateFileAppend =
        date.toDateString().replaceAll(" ", "-") +
        "-" +
        date.getHours() +
        "-" +
        date.getMinutes() +
        "-" +
        date.getSeconds();
      log.debug("");
      log.debug("");
      log.debug("");
      log.debug("datetime to append to screenshots:");
      log.debug(dateFileAppend);
      log.debug("");
      log.debug("Taking screenshot of filled in input fields.");
      log.debug("");
      // const screenshotsKeyValueStore = await Apify.openKeyValueStore(
      //   "aus-tokyo-flight-results-screenshots-" + dateFileAppend
      // );
      if (Apify.isAtHome()) {
        // we're running on the Apify platform,
        // save screenshot to keyvalue store
        let screenshot = await page.screenshot({ type: "png", fullPage: true });
        // Open a named key-value store
        await Apify.setValue("homePageImage", screenshot, {
          contentType: "image/png",
        });
      } else {
        // Take screenshot of home page
        await page.screenshot({
          path: "./screenshots/aus-tokyo-" + dateFileAppend + ".png",
          fullPage: true,
        });
      }

      //
      // Click search to get results!
      //
      log.debug("");
      log.debug("Looking for 'search' button.");
      await page.waitForSelector(
        "button.VfPpkd-LgbsSe.VfPpkd-LgbsSe-OWXEXe-k8QpJ.VfPpkd-LgbsSe-OWXEXe-Bz112c-M1Soyc.nCP5yc.AjY5Oe.qfvgSe.TUT4y"
      );
      log.debug("Clicking search button and waiting for navigation.");
      log.debug("");
      log.debug("");

      // DEBUG: this was used to watch requests. since waitForNavigation wasn't working, I had to figure out which requests were the ones needed to load the search results.
      log.debug("Turning on request logging.");
      page.on("request", logRequest);
      log.debug("");

      // There seem to be 3 important requests we need to wait for to see the results page be loaded.

      let response1, response2, response3;
      try {
        [response1, response2, response3] = await clickSearchAndWaitForResults(
          page
        );
      } catch (error) {
        // retry once
        log.debug("click search and wait for navigation failed. retrying...");
        log.debug("");

        const searchBtn = await page.$(
          "button.VfPpkd-LgbsSe.VfPpkd-LgbsSe-OWXEXe-k8QpJ.VfPpkd-LgbsSe-OWXEXe-Bz112c-M1Soyc.nCP5yc.AjY5Oe.qfvgSe.TUT4y"
        );

        if (searchBtn) {
          log.debug(
            "search button still shows. click it and wait for navigation to search results page"
          );
          // search btn still shows, try clicking again
          [response1, response2, response3] =
            await clickSearchAndWaitForResults(page);
        } else {
          // search btn not found, just wait for page to load
          log.debug(
            "search button not found. Just wait a bit and see if the search results page loads"
          );
          Apify.utils.sleep(15000);
        }
      }

      log.debug("Turning off request logging.");
      page.off("request", logRequest);
      log.debug("");

      log.debug("");
      log.debug("");
      log.debug("");
      log.debug("Scraping prices...");
      log.debug("attempting to scroll through all results");
      await page.waitForSelector("[role=listitem] .zISZ5c.QB2Jof", {
        visible: true,
        timeout: 30000,
      });
      log.debug("waiting for the 'more' button to load");
      await page.waitForSelector("[role=listitem] .zISZ5c.QB2Jof button");
      log.debug("finished loading");

      let theMoreBtn = await page.$("[role=listitem] .zISZ5c.QB2Jof");
      if (theMoreBtn !== null) {
        // O.O  a button
        log.debug("");
        log.debug("");
        log.debug("");
        log.debug("the more button was found");
        log.debug("");
        log.debug("");
        log.debug("");
        // let's click it!
        let theMoreBtnSpan = await theMoreBtn.$(".bEfgkb");
        let theMoreBtnSpanText = await theMoreBtnSpan.evaluate(
          (span) => span.innerText
        );
        log.debug("theMoreBtnSpanText");
        log.debug(theMoreBtnSpanText);
        log.debug("");

        let showMeMore = !theMoreBtnSpanText
          ? false
          : theMoreBtnSpanText.includes("more");

        let i = 0;
        while (showMeMore && i < 1000) {
          log.debug('trying to click "more" button');
          // let botton = await theMoreBtn.evaluateHandle((btn) => btn.click());
          await page.click("[role=listitem] .zISZ5c.QB2Jof button");
          log.debug("clicked");
          log.debug("");
          await Apify.utils.sleep(1000);

          theMoreBtn = await page.$("[role=listitem] .zISZ5c.QB2Jof");
          theMoreBtnSpan = await theMoreBtn.$("span");
          const theMoreBtnSpanProps = await theMoreBtnSpan.getProperties();
          log.debug("theMoreBtnSpanProps");
          log.debug([...theMoreBtnSpanProps.entries()]);
          log.debug("");
          // "==" because theMoreBtnSpan could be null or undefined
          theMoreBtnSpanText =
            theMoreBtnSpan == null
              ? null
              : await theMoreBtnSpan.evaluate((span) => span.innerText);
          log.debug("theMoreBtnSpanText");
          log.debug(theMoreBtnSpanText);
          log.debug("");

          // "==" because showMeMore could be null or undefined
          showMeMore =
            theMoreBtnSpanText == null
              ? false
              : theMoreBtnSpanText.includes("more");

          log.debug("showMeMore");
          log.debug(showMeMore);
          log.debug("");
          log.debug("");
          log.debug("");
          i++;
        }
      }

      // Create array of each row in results
      log.debug("");
      log.debug("Creating array of result rows");
      log.debug("");
      const roleListItems = await page.$$("[role=listitem]");
      // await roleListItems.$eval(".zISZ5c.QB2Jof", (node) => node.click());
      // await Apify.utils.puppeteer.infiniteScroll(page, {
      //   timeoutSecs: 30,
      //   waitForSecs: 5,
      //   scrollDownAndUp: true,
      //   buttonSelector: "[role=listitem] .zISZ5c.QB2Jof",
      // });

      // loop through each row and extract data
      // until we get to the last row
      log.debug("Iterating over results");
      // array for extracted data
      let flights = new Array();
      // count for notifying which result we're currently looking at
      let count = 1;
      // total number of results (including the more/hide row)
      // subtract 1 for the bottom row (hide/more)
      const totalResults = roleListItems.length - 1;
      if (!totalResults || totalResults < 0) {
        throw new Exception("Didn't find any results");
      }
      for (let f of roleListItems) {
        // check if we're at last row by looking for
        // the <span> element with text indicating if there's
        // more to show or to hide the extras
        // only the bottom row has this class
        let bottomRowSpan = await f.$(".bEfgkb");
        const c = f.asElement();
        const d = await c.getProperty("data-expandedlabel");
        log.debug('f.$eval("div", (node) => node.data-expandedlabel)');
        log.debug(d);
        log.debug("");
        log.debug("");
        log.debug("");
        // console.log("bottomRowSpan");
        // console.log(bottomRowSpan);
        // console.log("");
        // console.log("");
        // console.log("");

        // just checking the text of the span for whether
        // we've expanded all the results or not
        // either way, we'll want to break out of the loop
        // because we're either done extracting data or we
        // messed up earlier and didn't expand all results
        // "==" because innerTxt could be null or undefined
        let innerTxt =
          bottomRowSpan == null
            ? ""
            : await bottomRowSpan.evaluate((node) => node.innerText);
        log.debug("innerTxt");
        log.debug(innerTxt);
        log.debug("");
        if (innerTxt.includes("more")) {
          log.debug(
            "Uh oh. Found more button. Need to expand to see all results."
          );
          log.debug("");
          break;
        } else if (innerTxt.includes("Hide")) {
          log.debug("");
          log.debug("");
          log.debug("");
          log.debug(
            "We've hit the 'Hide' button, the last row on the results page."
          );
          log.debug("");
          log.debug("");
          log.debug("");
          break;
        }

        // check for the covid info row
        const covidInfo = await f.evaluate((node) => node.innerText);
        log.debug("covidInfo");
        log.debug(covidInfo);
        log.debug("");
        if (covidInfo.includes("advisory")) {
          log.debug("Travel Advisory row. Skipping...");
          log.debug("");

          // increment counter
          count++;
          continue;
        } else if (covidInfo.includes("COVID")) {
          log.debug("COVID advisory row. Skipping...");
          log.debug("");

          // increment counter
          count++;
          continue;
        }

        log.debug("");
        log.debug("");
        log.debug("");
        log.debug("We passed the bottom row check.");
        log.debug("");
        log.debug("");
        log.debug("");

        log.debug("");
        log.debug("Extracting Data from row #" + count + " / " + totalResults);
        log.debug("");

        // we're not at the bottom row
        // extract data
        // this is the object that'll contain all the data
        const data = new Object();

        // set departure date
        const depaDate = await page.$eval(
          "input[placeholder=Departure]",
          (node) => node.value
        );
        data.departureDate = depaDate;
        log.debug("departureDate");
        log.debug(depaDate);
        log.debug("");

        // set return date
        const retuDate = await page.$eval(
          "input[placeholder=Return]",
          (node) => node.value
        );
        data.returnDate = retuDate;
        log.debug("returnDate");
        log.debug(retuDate);
        log.debug("");

        // tip for future, they use .YMlIz.FpEdX.jLMuyc when
        // it's a better than typical fare, ie, when the
        // price shows in green in the UI
        //
        // grab price
        log.debug("");
        log.debug("Extracting Price");
        log.debug("");
        const price = await f.$eval(
          ".BVAVmf.I11szd.POX3ye > div > span[role=text]",
          (node) => node.innerText
        );
        data.price = price;

        // grab airline name
        log.debug("");
        log.debug("Extracting Airline");
        log.debug("");
        const airline = await f.$$eval(
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

        // grab departure and return flight times
        log.debug("");
        log.debug("Extracting Departure and Return Times");
        log.debug("");
        const times = await f.$$eval(
          ".zxVSec.YMlIz.tPgKwe.ogfYpf > .mv1WYe [role=text]",
          (nodes) => nodes.map((node) => node.innerText)
        );
        log.debug("times");
        log.debug(times);
        data.departureTime = times[0];
        data.arrivalTime = times[1];

        log.debug("");
        log.debug("Data extracted: ");
        log.debug(JSON.stringify(data));
        log.debug("");
        flights.push(data);

        // increment counter
        count++;
      }

      log.debug("");
      log.debug("Taking screenshot of results page.");
      log.debug("");
      log.debug("");
      log.debug("");
      if (Apify.isAtHome()) {
        // we're running on the Apify platform,
        // save screenshot to key value store
        screenshot = await page.screenshot({
          type: "png",
          fullPage: true,
        });
        log.debug("saving image to data store.");
        await Apify.setValue("resultsPageImage", screenshot, {
          contentType: "image/png",
        });
        log.debug("saved");
        log.debug("");
      } else {
        // Take screenshot of search results page
        await page.screenshot({
          path: "./screenshots/aus-tokyo-results-" + dateFileAppend + ".png",
          fullPage: true,
        });
        log.debug("saved");
        log.debug("");
      }

      // log.debug("flightInfos");
      // for (let f of flights) {
      //   log.debug(JSON.stringify(f));
      // }

      // Write flights to datastore
      // // Save a named dataset to a variable
      // const flightPricesDataset = await Apify.openDataset(
      //   "aus-tokyo-flight-prices-" + dateFileAppend
      // );
      log.debug("");
      log.debug("Push data to Apify storage");
      await Apify.pushData(flights);
      log.debug("");
      log.debug("");
      log.debug("");

      // Save title to table
      log.debug("Saving output...");
      log.debug("");
      await Apify.setValue("title", {
        title,
      });
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
