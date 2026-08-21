const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();
    
    let downloaded = false;
    page.on('response', async (response) => {
        if (response.url().includes('gasm.wasm')) {
            console.log(`Found gasm.wasm at ${response.url()}!`);
            const buffer = await response.body();
            fs.writeFileSync('gasm_new.wasm', buffer);
            console.log('Saved gasm_new.wasm!');
            downloaded = true;
        }
        if (response.url().includes('gasm.js')) {
            const buffer = await response.body();
            fs.writeFileSync('gasm_new.js', buffer);
            console.log('Saved gasm_new.js!');
        }
    });

    console.log('Navigating to embedindia.st...');
    await page.goto('https://embedindia.st/embed/laliga/2026-08-19/atm-mcf?gid=Ad7PiU9cdsfFnGyv%2FdNpxC2Cl9IM6lAGzsmUGAtIggr7j4DU3ZPcV0aMzrHKiqti%2BHwM4E2NSCpEjPeEyUsycp1hoOtzLIiczZq%2BOh0Z6oIjpXhlMoHTw4BJJzok2dl2%2BngePrAgWVK91bAf%2F7r5uLVn3C22nQeEtMuGkwPSCL9N%2FOJRu7QQIWhrj0u6vS9P6xI4zY7Camr086aVvxceN5PLsHdMUrArZ%2FlGihTwUPrtmnIasjkVg3I3cUHb5Vm27Lol3abUdhGcHwAIeccr9H%2BF%2FozqV1xq1eAd90772zcExTa6kYLdV4mfJzQCsL4tHpYtZ7CRXZRN%2FcOUepxgNT18%2BqfihGAMVipRr1cpIKqA8e1nhqwzxMO9s7O9XZCjqX5Yj1NUvVk7ZxF%2BsAU2gTqEqX7UWHaPJmidzK4VQl2UliHI9jYiWHuAmZ54ZOHVLx2YrWQ7yLCdAiBvaK1BiFVsQ%2FEQObaMO6caD3KXOQPwCyuX074JULBpjzONj1JCPusOe208071YNsUFNUzdrbcZCMny2ug%2Fwn8sWIfm%2BEqolgf3La1jA%2Bb0vsB8ct2h3BEWqW4SNAh87CEJY15isERy56kartJPt83zo8ybdnTWIWoxXF%2BrMoC%2BJ%2BFUofIWcvrWVUQa8G4jEtuciN2ISMs6MSNxt2G8sf0Jd%2FvtJYJkzT6Br%2BFReIneuvipRy2gT%2F7RWrPEJuitE0KZIYW%2B2zFt71KtkKboTVWPiVR6pwnQacXP8ZMyJVkquSFKnndJRVQN3VYd%2BLJX4%2FrFi8GyxV0OTbXW9v0kxnuLxWSy0f9hrnG5lB53CSbcyPJRxvRYH5Oj1CHvoXdCw0qLg0J5p4NeKMo1%2BXjuZhHGB8TMAPGtava1NHF6hdpu%2FyD4B9DH%2Fq6xo4KOIBG5FX%2F9TxwnRT%2B41EXa2%2FiLbk0b1o1KHYEjGM6KPo942rAHqELcsKlsw47%2BbFCqjn9hUkg6%2BsEXyPGsMKNcL9coZtc%2F%2BLAR27zY9xG9HyeF4UajWYIVqRPad%2BcqaC4LtlLktP%2FH5QoEwK7WpPm8Vfp6y2AO2ulSD16UFz96mEGQ%2FN13DZd0J6yR9H4LHBPmXNTmgkUXNnTFvgauK4D%2B9ZlsegFwhplAn6LcniesUFND0VT3bXE%2B81DRWwLBlBGdY1PGBa7cSIdM8kAUqcTf4to%2B%2BVw9eXh4XiBUGt4t%2BvN4Vid5iVAFiYzjaAmAXjX0XkJz1Ey%2FVUrKIhM9Q5JWByilzFeukFtQrqsRw69QseSM6eKWucUicfe6LG6xr2eZZbHUMDsPjcjPDVdEXZLpGWL7M2jEqrZrp12%2FYP25MNuOBIaGP3pB0gZQ0pFdUt8s8xil4POUcovq71RGx58leBAahlLxNXTlU24Rv9%2B3kCa8lpr8fdqjfBizCKwOL2n9mdrpfPJ8Xft6j7pVHHMS43OYZ8kWPE7fhwdYAGoe6sXAB6s25tdo8iK6GF%2BGqPyJAU%2BlmuOvqqIIV8Brdek%2BjOxh%2FrNASSFda4cUAwUixzqjO%2Bvilo%2B8SWZUzaeEALBNz7xSEl%2FrhiXqi0h3NIKyK9wtldqlrjkPADqeJreAOJAgTDje51%2FdfZ2Rg5lrsetfinaqUbVFkj2JQHLK1JTC9GxDWdL0oqzaVl6Y9YLdDsUL6nPuTM0AcyuBgUrdBWD6h%2BfJVTgLG1Y20w%3D%3D', { waitUntil: 'networkidle' });
    
    await page.waitForTimeout(3000);
    await browser.close();
    
    if (downloaded) {
        console.log('DONE!');
    } else {
        console.log('Did not find lock.wasm in network requests.');
    }
})();
