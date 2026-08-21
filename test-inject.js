
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.exposeFunction('onStreamUrl', (url) => {
      console.log('[EXPOSED FUNC M3U8]', url);
  });
  
  await page.addInitScript(() => {
        const originalFetch = window.fetch;
        window.fetch = async function () {
            let url = arguments[0];
            if (typeof url === 'string' && (url.includes('.m3u8') || url.includes('m3u8'))) {
                window.onStreamUrl(url);
            }
            return originalFetch.apply(this, arguments);
        };
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function () {
            let url = arguments[1];
            if (typeof url === 'string' && (url.includes('.m3u8') || url.includes('m3u8'))) {
                window.onStreamUrl(url);
            }
            return originalOpen.apply(this, arguments);
        };
  });

  const url = 'https://embedindia.st/embed/cricket/2026-08-19/eng-pak?gid=yH6JWOrYhQER6n5h7Jz%2Fw7GrUQhea6ToxqcjtFbmrj5t1n2SjKQQPUiwXRn5UOu%2BJy0DCtOt7zgx5N%2F7xuHRaPebm%2FGxD3n2NOvzcOamRWOb9OPtaiiPs757JC9Jfj%2FBrHamPBVPb3rjIs0GF3iAbHCNBFN%2FF8qew25QM43rdGlHqNUZh3ZdqMSeBxFySrMWZnWO972EzOQDQxvTQAR1c1Bm4%2FTbU3aFil8nafLPh8V2WAvamljab3ZUHEBC%2BeExEOsrWZWl9KiWMAaG%2BrZrpKcXagixs91ACiJ2Cqk36cs2LLco8aBNw22tzQd3dr0Cr4qZCSfRmslsxRNLJ6G%2B6h3LwF8%2BTwkCp9YyAerRW8VAEP%2B8T8gJJx4uuHw7GEJaQPSlCbIDWq74%2FZvTXfRwm39aW%2F%2BuEHlq6UwODuPo8PlXl8Uq4GCmSlmgLjhFjdEhDhF%2BREUgf4VxSiUg0JmgcDaVe%2BQT7ogpjjMH1TGUkIB9ptSxms3hSm%2B30iO54NBXOKIqtjvKz6DV7YpVexXQPtbj5XRmCJQRubTxSH5n4RlIG%2BngQnWEeBub0vO96jJb9sQQSClV%2FuI%2Fq9XZhu32dcgaLi%2BepgsrA%2FIqaQtaI9SvFRQRNm9EmDpx2D4EOywGAoP4H1WvYCT2J%2FiTvWonagrpDAvzBeMuAVxCQByMKi44%2B4Gur5TtThYPog8YXiRQhZak%2FuNwqNRFEyQigZWJ1pP5C83WvXl31rhyuoFx3%2Bavh60HuNt%2FaD4bhKqsgwdU9LgurzsWWWLTpZamkkWYXlLOQEmDJ2qy1vdMy9fYcLTByXsA9gbGRHvbBFeTfqszQ9ZccGRwZYWRWmcinwFcBGmiIguZ3D1Cb%2F%2FepkrvZOkDaf0jR%2F6rLw%2FgkngYNVyfxL%2F7%2Ft12B15LaEn0JQlSx9t6GjPy8GgOn74vAO5Dzt1ugsx5AuzVInClhyyBd%2FmzF49gmlPNInwaJW9qOK3xYPX5TsMsLIstWEqewnswzdPEC8mX5BPRgE8vq5egUCT%2Bj%2FsD9HukYrOdI%2BiGT%2FhpG9tH%2FsXtgN60QXt0gSgHoMabLR0oqMhroy1V9OJXjWwO5Z3VGI2fjL4kI2fngiwWdojkTu3NbrKfZmHRI%2BZVZQIVAkPMcKzfuscNausS81%2FDQxx8fB8E7w42bLS1EXIfU8%2F3VRYnDqR6Em1GjNoC0fJtnh19o7aSapaXfyxImpVrD5bJboosNn7BXZKkDdz7Mda06N2tvpU9OirrT1xt7zXUt58Nd5G5Ivvwi1gXJ9%2BLP8jpAQNq%2F0ne7NO5AYSzw0ztoaELd2%2FL%2FsFVHa2sWjcuKf3awk0Bh6lCp7owNxGRQ4qsX3LjodBIDsaIAPNaHN1CSQlgWtE0RXAsCfuAJfMTYE3kqOoMEVI6ACY70URVos%2FeOqByl3o9tSN9obxDfFU%2Fs8iRjhgbmSj8Q1hcaAfs%2B98F981fZ51YALiUzfrgnv9xhI4USMEMCKbKSPqq7%2FoN09xXPBW36IDQEIEkAfZ1ZQoRhsqvyHUWol22vGikGH0lQpjn%2By7t3XmHCUUPxtljFUF%2BcPpSYN9q3kSQrlNNAzChTp0Q4yEMm%2BaHNnJcZ3msC3XxhVLZ7CBfAH7dkybz7e0tH1sPzGB%2FtP2uYIq%2FTw9xsk96F6Ofz54Y1eQ3';
  await page.goto(url, { waitUntil: 'domcontentloaded', referer: 'https://embedindia.st/' });
  
  await page.waitForTimeout(10000);
  await browser.close();
})();

