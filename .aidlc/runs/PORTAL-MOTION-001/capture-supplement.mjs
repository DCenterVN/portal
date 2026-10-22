import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
const require = createRequire('/home/dawn/work/ticket/portal/package.json');
const { chromium } = require('@playwright/test');
const out = '/home/dawn/work/ticket/plans/261022-ui-motion/audit/supplement';
if (existsSync(`${out}/before-manifest.json`)) throw new Error('Giữ nguyên ảnh đã có.');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/brave.com/brave/brave' });
const records = [];
try {
  for (const width of [1440, 375]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({baseURL:'http://127.0.0.1:3000', viewport:{width,height:width===375?844:900}, colorScheme:theme, locale:'vi-VN'});
    await context.addInitScript(selected => {
      localStorage.setItem('dcenter_theme', selected);
      document.documentElement.dataset.theme = selected;
      document.documentElement.classList.toggle('dark', selected === 'dark');
    }, theme);
    const page = await context.newPage();
    const save = async (label, locator) => {
      const file = `before-${label}-${width}-${theme}.png`;
      await locator.screenshot({path:`${out}/${file}`,animations:'disabled'});
      records.push({screen:label,width,theme,status:'captured',file});
    };
    try {
      await page.goto('/activate');
      await page.getByRole('button',{name:'Gửi lại liên kết kích hoạt',exact:true}).waitFor();
      await page.waitForTimeout(2400);
      await save('V-09', page.getByText('Liên kết kích hoạt thiếu mã xác thực.',{exact:true}).first().locator('../..'));
      await page.goto('/forgot-password');
      await page.getByRole('button',{name:'Gửi liên kết đặt lại',exact:true}).waitFor();
      await page.waitForTimeout(2400);
      await save('V-08-forgot',page.locator('input[type="email"]'));
      await page.goto('/products');
      await page.getByPlaceholder('Tìm theo tên SKU, mã vạch...').waitFor();
      await page.waitForTimeout(2400);
      await save('V-10',page.getByRole('button',{name:'Tạo sản phẩm mới',exact:true}).locator('..'));
      await save('V-11',page.locator('footer'));
      records.push({screen:'catalog-geometry',width,theme,status:'measured',...await page.evaluate(()=>{
        const input=document.querySelector('main input');
        const icon=input?.parentElement?.querySelector('svg');
        const a=input?.getBoundingClientRect(),b=icon?.getBoundingClientRect();
        const footer=document.querySelector('footer');
        return {scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,searchIconCenterOffset:a&&b?(b.y+b.height/2)-(a.y+a.height/2):null,footerColor:footer?getComputedStyle(footer).color:null,footerBackground:footer?getComputedStyle(footer).backgroundColor:null};
      })});
      console.log(width,theme,'supplement captured');
    } catch { records.push({width,theme,status:'blocked',reason:'Selector hoặc màn chưa sẵn sàng.'});process.exitCode=1; }
    finally { await context.close(); }
  }
} finally {
  await browser.close();
  await writeFile(`${out}/before-manifest.json`,JSON.stringify({phase:'before',records},null,2)+'\n');
}
