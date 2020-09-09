// import 'expect-puppeteer';

const PORT = process.env.PORT || 5000;
var page1;
var page2;

beforeEach(async () => {
    await page.goto(`http://localhost:${PORT}`);
    page1 = page;

    page2 = await browser.newPage();
    await page2.goto(`http://localhost:${PORT}`);
})

test('login fail on empty username field', async () => {
    let dialog = await expect(page).toDisplayDialog(async () => {
        await expect(page).toClick('#usernameSubmit');
    });

    expect(dialog._message).toBe('Invalid username');
    await dialog.dismiss();
});

test('login success on valid username', async () => {
    await expect(page).toFill('#usernameField', "testUsername");
    await expect(page).toClick('#usernameSubmit');
    await expect(page).toMatch('Players');
});

test('login success on valid username', async () => {

    // login as 'user1'
    await expect(page1).toFill('#usernameField', "user1");
    await expect(page1).toClick('#usernameSubmit');

    // another login as 'user1' should be an error
    await expect(page2).toFill('#usernameField', "user1");
    let dialog = await expect(page2).toDisplayDialog(async () => {
        await expect(page2).toClick('#usernameSubmit');
    });

    expect(dialog._message).toBe('Username already exists');
    await dialog.dismiss();
});