const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const cac = require("cac");
const cli = cac();

const SEARCH_URL_IMAGE = "https://www.pixiv.net/search.php?word=";
const SEARCH_URL_NOVEL = "https://www.pixiv.net/novel/search.php?word=";

/**
 * クローラ
 *
 * @param {string} keyword 検索ワード
 */
const crawler = async (keyword, searchHost) => {
  // "--no-sandbox"で実行: https://github.com/GoogleChrome/puppeteer/issues/290
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();

  // 検索実行
  await page.goto(searchHost + keyword);
  const html = await page.$eval("html", elem => elem.innerHTML);
  await browser.close();

  return html;
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
const search = () => {
  (async () => {
      const word = "roselia";
      const host = SEARCH_URL_NOVEL;

    const html = await crawler(word, host);
    const count = await scrapingResultCount(html);

    console.log("result count = " + count);
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
    desc: "Get CP seach result count on pixiv then export result file."
  },
  () => {
    search();
  }
);

cli.parse();
