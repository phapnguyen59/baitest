const { Builder } = require('selenium-webdriver');
(async () => {
  const driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get('https://www.photo-ac.com/');
    await driver.sleep(5000);
    console.log('URL', await driver.getCurrentUrl());
    console.log('Title', await driver.getTitle());
    const html = await driver.executeScript('return document.documentElement.outerHTML');
    console.log(html.slice(0, 10000));
  } catch (err) {
    console.error(err);
  } finally {
    await driver.quit();
  }
})();
