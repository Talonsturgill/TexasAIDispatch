import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setConcurrency(4);
// Use the pre-installed Playwright headless-shell Chromium; never download a browser.
// The full Chrome binary has old-headless removed, so headless_shell is the one that works.
Config.setBrowserExecutable(
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'
);
Config.setChromeMode('headless-shell');
