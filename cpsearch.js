const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const cac = require("cac");
const cli = cac();
const config = require("./config.json");

const SEARCH_URL_IMAGE = "https://www.pixiv.net/search.php?word=";
const SEARCH_URL_NOVEL = "https://www.pixiv.net/novel/search.php?word=";
const LOGIN_URL = "https://accounts.pixiv.net/login";

/**
 * クローラ
 *
 * @param {string} keyword 検索ワード
 */
const crawler = {
  open: async () => {
    // "--no-sandbox"で実行: https://github.com/GoogleChrome/puppeteer/issues/290
    this.browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    this.page = await this.browser.newPage();
    await console.log("Process: Background browser started.");
  },
  close: async () => {
    await this.browser.close();
    await console.log("Process: Background browser closed.");
  },
  login: async config => {
    await console.log(`Process: Openning.. ${LOGIN_URL}`);
    await this.page.goto(LOGIN_URL);
    
    await console.log(`Process: Login user = ${config.account.user}`);
    await this.page.type('#container-login input[autocomplete="username"]', config.account.user);
    await this.page.type('#container-login input[autocomplete="current-password"]', config.account.pw);

    await this.page.click('#container-login button[type=submit]');
    await console.log(`Process: Waiting login..`);
    await this.page.waitFor(3000);
  },
  search: async (keyword, searchHost) => {
    await this.page.goto(searchHost + keyword);
    const html = await this.page.$eval("html", elem => elem.innerHTML);
    return await scrapingResultCount(html);
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
    if (config.view_r_ratio === true) {
      await crawler.login(config);
    }

    for (const word of words) {
      const count = await crawler.search(word, host);
      await console.log(`${type} count of "${word}" = ${count}`);

      if (config.view_r_ratio === true) {
        const wordR = word + " R-18";
        const countR = await crawler.search(wordR, host);
        await console.log(`${type} count of "${wordR}" = ${countR}`);
        await console.log(`R-18 ratio = ${Math.round((countR / count) * 100)}% \n===========`)
      }
    }

    // browser end
    await crawler.close();

    console.log("terminated.");
    process.exit(1);
  })().catch(err => {
    console.log("ERROR!! ===============\n" + err);
    process.exit(1);
  });
};

/**
 * CLI commands
 */
cli.command(
  "run",
  {
    desc: "Get search result count on pixiv. Require search words setting of config.json file."
  },
  () => {
    search(config);
  }
);

cli.parse();
