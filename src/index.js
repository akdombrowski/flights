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
      log.debug("A request was made: \n" + interceptedRequest.url());
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
      // log.debug("goToURL");
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
      let t = 0;
      while (!austinDropdownItem && t < 100) {
        try {
          austinDropdownItem = await page.waitForSelector(
            'li[aria-label="Austin, Texas"]',
            { visible: true, timeout: 1000 }
          );
        } catch (error) {
          log.debug("Trying again.");
          log.debug(
            "Switch focus to where to input field briefly before switching back."
          );
          await whereTo.focus();
          await whereFrom.focus();
          await whereFrom.press("Backspace");
          await whereFrom.type("Austin", { delay: 00 });
          austinDropdownItem = await page.waitForSelector(
            'li[aria-label="Austin, Texas"]',
            { visible: true, timeout: 1000 }
          );
        } finally {
          t++;
        }
      }

      // click it!
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

      //
      // Screenshot
      //
      log.debug("Taking screenshot of filled in input fields.");
      log.debug("");
      const screenshotsKeyValueStore = await Apify.openKeyValueStore("screenshots");
      if (Apify.isAtHome()) {
        // we're running on the Apify platform,
        // save screenshot to keyvalue store
        let screenshot = await page.screenshot({ type: "png", fullPage: true });
        // Open a named key-value store
        await screenshotsKeyValueStore.setValue("homePageImage", screenshot, {
          contentType: "image/png",
        });
      } else {
        // Take screenshot of home page
        await page.screenshot({
          path: "./screenshots/aus-tokyo-" + dateLocale + ".png",
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
      log.debug("");

      // DEBUG: this was used to watch requests. since waitForNavigation wasn't working, I had to figure out which requests were the ones needed to load the search results.
      log.debug("Turning on request logging.");
      page.on("request", logRequest);
      log.debug("");
      log.debug("");
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
      await page.waitForSelector("[role=listitem] .zISZ5c.QB2Jof .bEfgkb", {
        visible: true,
        timeout: 30000,
      });
      log.debug("waiting for the 'more' button's icon to load");
      await page.waitForSelector("[role=listitem] .zISZ5c.QB2Jof svg");
      log.debug("finished loading");

      let theMoreBtn = await page.$("[role=listitem] .zISZ5c.QB2Jof");
      if (theMoreBtn !== null) {
        // O.O  a button
        log.debug("the more button was found");
        log.debug("");
        // let's click it!
        let theMoreBtnSpan = await theMoreBtn.$(".bEfgkb");
        let theMoreBtnSpanText = await theMoreBtnSpan.evaluate(
          (span) => span.innerText
        );
        log.debug("theMoreBtnSpanText");
        log.debug(theMoreBtnSpanText);
        log.debug(typeof theMoreBtnSpanText);
        log.debug("");

        let showMeMore = !theMoreBtnSpanText
          ? false
          : theMoreBtnSpanText.includes("more");

        let i = 0;
        while (showMeMore && i < 1000) {
          log.debug('trying to click "more" button');
          // let botton = await theMoreBtn.evaluateHandle((btn) => btn.click());
          await page.click("[role=listitem] .zISZ5c.QB2Jof");
          log.debug("clicked");
          log.debug("");
          await Apify.utils.sleep(1000);

          theMoreBtn = await page.$("[role=listitem] .zISZ5c.QB2Jof");
          theMoreBtnSpan = await theMoreBtn.$(".bEfgkb");
          log.debug("theMoreBtnSpan");
          log.debug(theMoreBtnSpan);
          theMoreBtnSpanText =
            theMoreBtnSpan == null
              ? null
              : await theMoreBtnSpan.evaluate((span) => span.innerText);
          showMeMore =
            theMoreBtnSpanText == null
              ? false
              : theMoreBtnSpanText.includes("more");

          log.debug("theMoreBtnSpanText");
          log.debug(theMoreBtnSpanText);
          log.debug("showMeMore");
          log.debug(showMeMore);
          log.debug("");
          i++;
        }
      }

      const roleListItems = await page.$$("[role=listitem]");
      // await roleListItems.$eval(".zISZ5c.QB2Jof", (node) => node.click());
      // await Apify.utils.puppeteer.infiniteScroll(page, {
      //   timeoutSecs: 30,
      //   waitForSecs: 5,
      //   scrollDownAndUp: true,
      //   buttonSelector: "[role=listitem] .zISZ5c.QB2Jof",
      // });

      let flights = new Array();
      for (let f of roleListItems) {
        let bottomRowSpan = await f.$(".bEfgkb");
        let innerTxt =
          bottomRowSpan == null
            ? ""
            : await bottomRowSpan.evaluate((node) => node.innerText);

        if (innerTxt.includes("more")) {
          log.debug(
            "Uh oh. Found more button. Need to expand to see all results."
          );
          log.debug("");
          continue;
        } else if (innerTxt.includes("Hide")) {
          log.debug(
            "We've hit the 'Hide' button, the last row on the results page."
          );
          log.debug("");
          continue;
        }

        const data = new Object();

        // tip for future, they use .YMlIz.FpEdX.jLMuyc when
        // it's a better than typical fare, ie, when the
        // price shows in green in the UI
        const price = await f.$eval(
          ".YMlIz.FpEdX > span",
          (node) => node.innerText
        );
        data.price = price;

        // const airline = await flight.$$(
        //   ".TQqf0e.sSHqwe.tPgKwe.ogfYpf > span");
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

        const times = await f.$$eval(
          ".zxVSec.YMlIz.tPgKwe.ogfYpf > .mv1WYe [role=text]",
          (nodes) => nodes.map((node) => node.innerText)
        );
        log.debug("times");
        log.debug(times);
        data.departureTime = times[0];
        data.arrivalTime = times[1];

        log.debug(JSON.stringify(data));
        flights.push(data);
      }

      log.debug("Taking screenshot of results page.");
      log.debug("");
      if (Apify.isAtHome()) {
        // we're running on the Apify platform,
        // save screenshot to key value store
        screenshot = await page.screenshot({
          type: "png",
          fullPage: true,
        });
        log.debug("saving image to data store.");
        await screenshotsKeyValueStore.setValue(
          "resultsPageImage",
          screenshot,
          {
            contentType: "image/png",
          }
        );
        log.debug("saved");
        log.debug("");
      } else {
        // Take screenshot of search results page
        await page.screenshot({
          path: "./screenshots/aus-tokyo-results-" + dateLocale + ".png",
          fullPage: true,
        });
      }
      log.debug("flightInfos");
      for (let f of flights) {
        log.debug(JSON.stringify(f));
      }
      // Write flights to datastore
      // Save a named dataset to a variable
      const flightPricesDataset = await Apify.openDataset("aus-tokyo-flight-prices");
      await flightPricesDataset.pushData(flights);
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
