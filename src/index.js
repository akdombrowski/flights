// This is the main Node.js source code file of your actor.
// It is referenced from the "scripts" section of the package.json file,
// so that it can be started by running "npm start".

// Import Apify SDK. For more information, see https://sdk.apify.com/
const Apify = require("apify");
const { log } = Apify.utils;

const {
  initializeApp,
  applicationDefault,
  cert,
} = require("firebase-admin/app");
const {
  getFirestore,
  Timestamp,
  FieldValue,
} = require("firebase-admin/firestore");

Apify.main(async () => {
  // Get input of the actor (here only for demonstration purposes).
  // If you'd like to have your input checked and have Apify display
  // a user interface for it, add INPUT_SCHEMA.json file to your actor.
  // For more information, see https://docs.apify.com/actors/development/input-schema
  const input = {
    url: "https://www.nfl.com/prospects/participants/all/",
  };

  //
  //
  // init cloud firestore
  //
  //
  const serviceAccount = require("./path/to/serviceAccountKey.json");

  initializeApp({
    credential: cert(serviceAccount),
  });

  const db = getFirestore();

  //
  //
  //
  if (!input || !input.url)
    throw new Error('Input must be a JSON object with the "url" field!');

  //
  //
  //
  try {
    const launchContext = {
      // Native Puppeteer options
      launchOptions: {
        //     headless: true,
        //     args: ["--some-flag"],
        timeout: 60000,
        ignoreDefaultArgs: ["--disable-extensions"],
      },
    };
    log.info("");
    log.info("Launching Puppeteer...");
    log.info(
      "" +
        "" +
        "" +
        "                                                   ,:" +
        "                                                 ,' |" +
        "                                                /   :" +
        "                                             --'   /" +
        "                                             / />/" +
        "                                             / /_\\" +
        "                                          __/   /" +
        "                                          )'-. /" +
        "                                          ./  :\\" +
        "                                           /.' '" +
        "                                         '/'" +
        "                                         +" +
        "                                        '" +
        "                                      `." +
        '                                  .-"-' +
        "                                 (    |" +
        "                              . .-'  '." +
        "                             ( (.   )8:" +
        "                         .'    / (_  )" +
        "                          _. :(.   )8P  `" +
        "                      .  (  `-' (  `.   ." +
        "                       .  :  (   .a8a)" +
        '                      /_`( "a `a. )"\'' +
        "                  (  (/  .  ' )=='" +
        '                 (   (    )  .8"   +' +
        "                   (`'8a.( _(   (" +
        "                ..-. `8P    ) `  )  +" +
        "              -'   (      -ab:  )" +
        "            '    _  `    (8P\"Ya" +
        "          _(    (    )b  -`.  ) +" +
        '         ( 8)  ( _.aP" _a   ( \\  *' +
        "       +  )/    (8P   (88    )  )" +
        '          (a:f   "     `"       `' +
        ""
    );
    log.info("");
    log.info("");

    // console.log("Launching Puppeteer...");
    const browser = await Apify.launchPuppeteer(launchContext);
    try {
      console.log("");
      console.log("");
      console.log("");
      console.log(`Opening page ${input.url}...`);
      console.log("");
      const page = await browser.newPage();
      page.on("console", async (msg) => {
        const msgArgs = msg.args();
        for (let i = 0; i < msgArgs.length; ++i) {
          console.log(await msgArgs[i].jsonValue());
        }
      });
      await page.goto(input.url);

      const title = await page.title();
      console.log("");
      console.log(`Title of the page "${input.url}" is "${title}".`);
      console.log("");

      console.log("");
      console.log("Getting nfl draft prospects...");
      console.log("");

      // wait for "loadedContent" which contains player list
      // document.querySelector("#main-content > section:nth-child(3) > div > div > div > div > div > div.loadedContent")
      //
      console.log("");
      console.log("Waiting for content to load...");
      console.log("");
      await page.waitForXPath(
        "//body[1]/div[3]/main[1]/section[2]/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div[1]/div[1]/div[1]"
      );

      // load loadedContent node first and use that as a relative root
      const loadedContent = await page.$(".loadedContent");
      const playerInfoBlockArr = await loadedContent.$x("./div/div/div/div");
      const playerInfoBlock = playerInfoBlockArr[0];
      const players = await playerInfoBlock.$x("child::div");
      const playerLinks = await playerInfoBlock.$x(".//a");

      console.log("Number of players:");
      console.log(players.length);
      console.log("Number of playerLinks:");
      console.log(playerLinks.length);

      const links = [];
      for (const elementHandle of playerLinks) {
        const href = await elementHandle.evaluate((node) => node.href);
        const threeThingsContainer = await elementHandle.$x(
          "./div/div/div/div/div/div"
        );
        links.push(href);
        const theThreeThings = await threeThingsContainer[0].$x("./div");
        const imgNode = theThreeThings[0];
        const nameDetailsNode = theThreeThings[1];
        const scoreNode = theThreeThings[2];

        //
        // image handling, left container
        //
        const imgArr = await imgNode.$x(".//img");
        const imgLink = await imgArr[0].evaluate((node) => node.src);

        //
        // name, year, position, team handling; middle container
        //
        // break the middle container down into: 1) name and year 2) position and team.
        const nameYearPositionTeamContainer = await nameDetailsNode.$x("./div");
        const nameYear = nameYearPositionTeamContainer[0];
        const positionTeam = nameYearPositionTeamContainer[1];

        // split name and year to get each value
        const nameYearArr = await nameYear.$x("./div");
        const nameNode = nameYearArr[0];
        const yearNode = nameYearArr[1];
        const name = await nameNode.evaluate((node) => node.innerText);
        const yearWithParen = await yearNode.evaluate((node) => node.innerText);
        // strip year of parentheses
        const year = yearWithParen.slice(1, 5);

        const positionTeamString = await positionTeam.evaluate(
          (node) => node.innerText
        );
        // split string into position and team
        const posTeamStrArr = positionTeamString.split("•");
        const position = posTeamStrArr[0].trim();
        const team = posTeamStrArr[1].trim();

        //
        // score, right container
        //
        const scoreChildren = await scoreNode.$x("./div");
        const scoreCount = await scoreChildren[0].evaluate(
          (node) => node.innerText
        );

        await Apify.pushData({
          name: name,
          img: imgLink,
          year: year,
          pos: position,
          team: team,
          score: scoreCount,
        });
      }
    } catch (error) {
      console.log("");
      console.log("");
      console.log("browser or other error:");
      console.log(error);
      console.log("");
      log.error("");
      log.error("browser or other error:");
      log.error(error);
    } finally {
      console.log("");
      console.log("Closing Puppeteer...");
      console.log("");
      log.info("");
      log.info("Closing Puppeteer...");

      await browser.close();

      console.log("");
      console.log("");
      console.log("Done.");
      console.log("");
      log.info("");
      log.info("Done.");
    }
  } catch (e) {
    console.log("");
    console.log("");
    console.log("Launch Puppeteer error:");
    console.log(e);
  }
});
