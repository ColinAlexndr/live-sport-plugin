const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('request', request => {
    const url = request.url();
    console.log('>> [REQUEST]', request.method(), url);
    if (url.includes('/fetch')) {
      console.log('   HEADERS:', JSON.stringify(request.headers()));
      const postData = request.postDataBuffer();
      console.log('   POST DATA (HEX):', postData ? postData.toString('hex') : 'null');
      console.log('   POST DATA (UTF8):', postData ? postData.toString('utf8') : 'null');
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/fetch')) {
      console.log('<< [RESPONSE FETCH]', response.status(), url);
      const body = await response.body();
      console.log('   BODY (HEX):', body.toString('hex'));
    }
  });
  
  await page.goto('https://embedindia.st/embed/247-south-park?gid=avgcGAFopshjWiBd%2B%2BFJ9wRMZA2YE%2FuzLfaSFSMytFxjZn%2F9AODQuZING8XYoaR8an3p43uketQeY0q%2F8GHUuF4muxIJW0PKUOYP2MvZ2xTDwaAoFZOQEaguqU4VKlup6RI53XAPbLkT7vEyKHQvjyGbNm4NVvcVHaaFvvKChdlv0PxatxjOyW6P81LIxg6ChYwoO%2Bcm9wR5Xqawe%2BbTE1zBX98jeGTY9m640licjCobg%2B2mLn3Ln9QMihoGi0sqS7AZ6fJTaiNLGk5YMC5XLowZ1SNwuLBV8o1fSsfWNPNlJywKlXCR%2BxSmPijgtc94YYeUQDvHZwh20b1ZiA6FLS7FFH4%2F45FLllFIPgE%2BwSJkbwCfre11aGr7XTuF19YWXFzn%2BA65p2MDkQzHUOOhCY%2FqUIQpuZsHrLBc2hm%2BTOJRkHXyKvX8yLah1OR5LA5%2FoAn9Nwq58P9Ucqjfb5bZYuy6jwSszS%2F8tGssGI75C2i8LcuLlpt%2B7kD0aDTAFUsQW6%2B9oCMHPpj8%2FmQ7DG00DARUKEMqc%2FVnK4XTAkjsPXFyCdbj%2B5DeYgQDt%2BY9z1xEsGQKhPTBV5FfABzVaLKrYmAUzaZRc8sURjahtvFu2kCAXHxD8AOYd67DZopQKtWZVrkSk4cebBfDIKnf0QjEgycGFnci8XdIJikcROBBWsOfzglCIZu3KST1wPIlrg0IS5uSoXfGWmLr6Yg94jrWfAmco1VvvilTe2tsDhRllDoFHx7s69xozTHiVsqWLNLkjmyER63NoOUcjopE5OnhASOyFeMEJSmvYQla8mkAStWTHMrJ0ihO%2FWhD3CZ8WFo25XS%2FwS5xcknpCurkPxtAkJJcHS8r0zyXXIpQwz7Gv87MFfrApFo17sPZsKlTw91X1elG1Zy0%2BDyIJRkUuB99JQyJ8%2Bi5hsFi%2B6HDACv%2FxcZfj4IczVO9LGROFqSgfnBWne41VC5brzdCzYwxb2j4STUvLlzjUaIOnXE4OGwo4TTl%2B0tWhufTFx5SMFWPFzcgOwy3reIT%2FXdEQI3qJWy6fi54L1TESWIuuxBD2%2Bg0uAv%2F6lqVIwkucK7IwvkDRP05KvzNuU66yqX7PjpjWTzyQy8SihQJENWJ%2FFCi00KZnVAWzoD4f%2Bwpc5gwqgjs8ttZKEnB0IVDG77Psde1N5xCE%2FlhKGCVwNPtKtXtvotNtKSri6rsuZJWA%2BCwh%2FLy8ztOQkYU3pzBmVNQI90vDm0GHij4NS9XljJ73XqPQ%2FvbHPcAJkAjOGS%2FQEQhHoeXAiRfaLVm1%2B%2BypAQHkb%2BGOiRZfMxcumskLyrm0HR6uIxpYa2QZUvgRmdRSnwkHoJEeFGQdEK7hsjY5TJhV5Kf1DV9tC6YZsfO5XTkk6BLU4L0SirIIwDR1pAjTf093RfNb3tIwwtdctRHT2WlxQPdiLrw1q6H3ox9IjktTQPYhlu0J0LGSB8d8vKFkrLAqqhZuBE0bhKxWBX9DdfqNPgctF1B%2B9dE6sQ6QDzQDTqmveAhS6vY81Bk8CkerT8DhlwB9vIG', {
    waitUntil: 'networkidle',
    referer: 'https://bfreer.com/'
  });

  await page.waitForTimeout(3000);
  console.log('Done.');
  await browser.close();
}

main().catch(console.error);
