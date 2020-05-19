// Forked and simplified from https://github.com/jaredpalmer/tsdx
import chalk from 'chalk';
import execa from 'execa';
import ora from 'ora';
import {
  RollupWatchOptions,
  watch as rollupWatch,
  WatcherOptions,
} from 'rollup';
import {
  cleanDistFolder,
  clearConsole,
  getInputs,
  getPackageName,
  logError,
  normalizeOpts,
  parseArgs,
} from './utils';
import { createBuildConfigs, writeCjsEntryFile } from './build';

async function watch() {
  const opts = await normalizeOpts(parseArgs());
  const buildConfigs = await createBuildConfigs(opts);
  if (!opts.noClean) {
    await cleanDistFolder();
  }
  opts.name = opts.name || getPackageName(opts);
  opts.input = await getInputs(opts.entry);

  await writeCjsEntryFile(opts.name);

  type Killer = execa.ExecaChildProcess | null;

  let firstTime = true;
  let successKiller: Killer = null;
  let failureKiller: Killer = null;

  function run(command?: string) {
    if (!command) {
      return null;
    }

    const [exec, ...args] = command.split(' ');
    return execa(exec, args, {
      stdio: 'inherit',
    });
  }

  function killHooks() {
    return Promise.all([
      successKiller ? successKiller.kill('SIGTERM') : null,
      failureKiller ? failureKiller.kill('SIGTERM') : null,
    ]);
  }

  const spinner = ora().start();

  rollupWatch(
    (buildConfigs as RollupWatchOptions[]).map((inputOptions) => ({
      watch: {
        silent: true,
        include: ['src/**'],
        exclude: ['node_modules/**'],
      } as WatcherOptions,
      ...inputOptions,
    }))
  ).on('event', async (event) => {
    // clear previous onSuccess/onFailure hook processes so they don't pile up
    await killHooks();
    if (event.code === 'START') {
      if (!opts.verbose) {
        clearConsole();
      }
      spinner.start(chalk.bold.cyan('Compiling modules...'));
    }
    if (event.code === 'ERROR') {
      spinner.fail(chalk.bold.red('Failed to compile'));
      logError(event.error);
      failureKiller = run(opts.onFailure);
    }
    if (event.code === 'END') {
      spinner.succeed(chalk.bold.green('Compiled successfully'));
      console.log(`
${chalk.dim('Watching for changes')}
`);
      try {
        if (firstTime && opts.onFirstSuccess) {
          firstTime = false;
          run(opts.onFirstSuccess);
        } else {
          successKiller = run(opts.onSuccess);
        }
      } catch (_error) {}
    }
  });
}

watch();
