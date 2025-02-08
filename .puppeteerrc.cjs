const { join } = require("path");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  cacheDirectory: join("..", ".cache", "puppeteer"),
  executablePath: join(
    "..",
    ".cache",
    "puppeteer",
    "chrome",
    "linux-133.0.6943.53",
    "chrome-linux64",
    "chrome"
  ),
  skipDownload: false,
};
