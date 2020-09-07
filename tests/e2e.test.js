// import 'expect-puppeteer';

test('login', async () => {
    await page.goto('http://localhost:5000');
    await expect(page).toMatch('GOTCHA');
})