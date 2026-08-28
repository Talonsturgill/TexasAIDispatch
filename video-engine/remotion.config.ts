import { Config } from '@remotion/cli/config';
import {existsSync} from 'node:fs';

Config.setVideoImageFormat('jpeg');
Config.setConcurrency(4);
// A browser path belongs to the runner, not to the repository. The old config pinned one
// Playwright cache revision under /opt; every other machine failed before rendering a frame.
// When the runner supplies a path, verify it. Otherwise Remotion manages its own compatible
// headless shell.
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE;
if (browserExecutable) {
  if (!existsSync(browserExecutable)) {
    throw new Error(`REMOTION_BROWSER_EXECUTABLE does not exist: ${browserExecutable}`);
  }
  Config.setBrowserExecutable(browserExecutable);
}
Config.setChromeMode('headless-shell');
