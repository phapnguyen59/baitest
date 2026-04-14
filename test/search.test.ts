import { Builder, By, Key, until, WebDriver, WebElement } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { expect } from 'chai';

describe('photo-ac.com search functionality', function () {
  this.timeout(45000);
  let driver: WebDriver;

  before(async () => {
    const options = new chrome.Options();

    options.addArguments(
      'disable-gpu',
      'no-sandbox',
      'disable-dev-shm-usage',
      'disable-extensions',
      'ignore-certificate-errors',
      'allow-insecure-localhost',
      'proxy-server=direct://',
      'proxy-bypass-list=*'
    );

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  // ==============================
  // 🔥 Helper: get visible element
  // ==============================
  async function getVisibleElement(selector: string, timeout = 15000): Promise<WebElement> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const elements = await driver.findElements(By.css(selector));

      for (const el of elements) {
        if (await el.isDisplayed()) {
          return el;
        }
      }

      await driver.sleep(300);
    }

    throw new Error(`❌ Không tìm thấy visible element: ${selector}`);
  }

  // ==============================
  // 🔥 Search function
  // ==============================
  async function searchFor(keyword: string) {
    await driver.get('https://www.photo-ac.com/');


    // 🔥 1. input visible (fix duplicate #sw)
    const searchInput = await getVisibleElement('#sw');


    // 🔥 3. input keyword
    await searchInput.clear();
    await searchInput.sendKeys(keyword);

    console.log(`✅ Input keyword: ${keyword}`);

    // ❌ KHÔNG dùng ENTER (tránh open new tab)
    const searchButton = await getVisibleElement('#search_btn');
    await searchButton.click();

    // 🔥 4. wait URL change
    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes('search') || url.includes('q=');
    }, 15000);
  }

  // ==============================
  // TEST 1
  // ==============================
  it('should display results for a valid keyword search', async () => {
    await searchFor('flower');

    const results = await driver.wait(async () => {
      const els = await driver.findElements(By.css('figure.ac-ig-item.loaded'));
      return els.length > 0 ? els : null;
    }, 15000);

    expect(results!.length).to.be.greaterThan(0);
  });

  // ==============================
  // TEST 2
  // ==============================
  it('should show no results or warning for invalid keyword', async () => {
    await searchFor('qwertyuiopasdfghjklzxcvbnm');

      const el = await driver.wait(
      until.elementLocated(By.css('span.ac-ml-2')),
      15000
    );

    const text = await el.getText();

    expect(text).to.include('該当する写真がありませんでした');
      });

  // ==============================
  // TEST 3
  // ==============================
  it('should preserve the search term after submitting', async () => {
    const keyword = 'landscape';
    await searchFor(keyword);

    const searchInput = await getVisibleElement('#sw');
    const value = await searchInput.getAttribute('value');

    expect(value).to.equal(keyword);
  });

});