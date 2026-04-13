import { Builder, By, Key, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { expect } from 'chai';

// Note: photo-ac.com is protected by CloudFront/AWS WAF human verification.
// Automated runs may be blocked by a CAPTCHA page before the actual search form loads.
describe('photo-ac.com search functionality', function () {
  this.timeout(45000);
  let driver: WebDriver;

  before(async () => {
    const options = new chrome.Options();
    // Run Chrome in headless mode for more stable CI/test execution.
    options.addArguments(
      '--headless=new',
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

  async function searchFor(keyword: string) {
    await driver.get('https://www.photo-ac.com/');

    // Dismiss any common consent or overlay dialogs before searching.
    await driver.executeScript(() => {
      const labels = ['accept', 'agree', 'ok', 'close', 'dismiss'];
      const elements = Array.from(document.querySelectorAll('button, a')) as HTMLElement[];
      for (const element of elements) {
        const text = (element.textContent || '').trim().toLowerCase();
        if (labels.some((label) => text.includes(label))) {
          element.click();
          break;
        }
      }
    });

    const searchSelectors = [
      'input[name="kw"]',
      'input[type="search"]',
      'input[name="q"]',
      'input[id*="search"]',
      'input[class*="search"]',
      'input[placeholder*="Search"]',
      'input[aria-label*="Search"]'
    ];

    const searchInput = await driver.wait(
      until.elementLocated(By.css(searchSelectors.join(', '))),
      15000
    );

    await driver.wait(until.elementIsVisible(searchInput), 15000);
    await driver.wait(until.elementIsEnabled(searchInput), 15000);
    await searchInput.clear();
    await searchInput.sendKeys(keyword, Key.RETURN);

    await driver.wait(until.urlContains('search'), 15000);
  }

  it('should display results for a valid keyword search', async () => {
    // Case 1: Enter a common keyword and verify that search returns at least one image result.
    await searchFor('flower');

    const results = await driver.wait(
      until.elementsLocated(By.css('.search-result-item, .photo-list-item')),
      10000
    );

    expect(results.length).to.be.greaterThan(0);
  });

  it('should show no results or a warning for an unlikely keyword', async () => {
    // Case 2: Enter an unlikely keyword and verify the site indicates no matching images.
    await searchFor('qwertyuiopasdfghjklzxcvbnm');

    const noResultMessage = await driver.findElements(By.css('.search-notice, .no-result'));
    expect(noResultMessage.length).to.be.greaterThan(0);
  });

  it('should preserve the search term after submitting the form', async () => {
    // Case 3: Submit a search and confirm the search input still contains the query on the results page.
    const keyword = 'landscape';
    await searchFor(keyword);

    const searchInput = await driver.wait(
      until.elementLocated(By.css('input[name="kw"]')),
      10000
    );
    const value = await searchInput.getAttribute('value');

    expect(value).to.equal(keyword);
  });
});
