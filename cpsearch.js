const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const cac = require("cac");
const cli = cac();
const config = require("./config.json");

const SEARCH_URL_IMAGE = "https://www.pixiv.net/search.php?word=";
const SEARCH_URL_NOVEL = "https://www.pixiv.net/novel/search.php?word=";

/**
 * クローラ
 *
 * @param {string} keyword 検索ワード
 */
const crawler = {
  open: async () => {
    // "--no-sandbox"で実行: https://github.com/GoogleChrome/puppeteer/issues/290
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    this.browser = await browser.newPage();
    await console.log("Process: Browser openned.");
  },
  close: async () => {
    await this.browser.close();
    await console.log("Process: Browser closed.");
  },
  search: async (keyword, searchHost) => {
    await this.browser.goto(searchHost + keyword);
    return await this.browser.$eval("html", elem => elem.innerHTML);
  }
};

/**
 * 検索結果件数のスクレイピング
 *
 * @param {string} html
 */
const scrapingResultCount = async html => {
  const $ = cheerio.load(html);
  return $("span.count-badge")
    .text()
    .replace("件", "");
};

/**
 * 検索を実行して結果件数を出力
 */
const search = config => {
  (async () => {
    const words = config.words;
    const host = config.type_novel === true ? SEARCH_URL_NOVEL : SEARCH_URL_IMAGE;
    const type = config.type_novel === true ? "Novels" : "Pictures";

    // starting headless browser
    await crawler.open();

    for (const word of words) {
      const html = await crawler.search(word, host);
      const count = await scrapingResultCount(html);
      await console.log(`${type} count of "${word}" = ${count}`);
    }

    // browser end
    await crawler.close();

    console.log("terminated.");
  })().catch(err => {
    console.log("ERROR!! ===============\n" + err);
  });
};

/**
 * CLI
 */
cli.command(
  "run",
  {
    desc:
      "Get CP seach result count on pixiv. Require search words setting of config.json file."
  },
  () => {
    search(config);
  }
);

cli.parse();
