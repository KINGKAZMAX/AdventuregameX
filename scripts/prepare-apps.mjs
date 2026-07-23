import { cpSync, existsSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const targetRoot = process.argv[2] || 'public';

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function copyTree(from, to) {
  if (!existsSync(from)) {
    console.error(`Expected path missing: ${from}`);
    process.exit(1);
  }

  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
}

rmSync(targetRoot, { recursive: true, force: true });

run('npm', ['--prefix', 'apps/game-boy', 'install']);
run('npm', ['--prefix', 'apps/dammagotchi', 'install']);
run('npm', ['--prefix', 'apps/game-boy', 'run', 'build']);
run('npm', ['--prefix', 'apps/dammagotchi', 'run', 'build']);

copyTree('apps/game-boy/dist', `${targetRoot}/game-boy`);
copyTree('apps/dammagotchi/dist', `${targetRoot}/dammagotchi`);
