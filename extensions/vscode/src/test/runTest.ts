import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { DebuggerProcess, formatProtocolMismatchMessage } from '../cli/debuggerProcess';
import { resolveSourceBreakpoints } from '../dap/sourceBreakpoints';

async function main(): Promise<void> {
  const compatibilityMessage = formatProtocolMismatchMessage({
    extensionVersion: '0.1.0',
    backendName: 'soroban-debug',
    backendVersion: '0.0.0',
    backendProtocolMin: 0,
    backendProtocolMax: 0,
    extra: 'Protocol mismatch: client supports [1..=1], server supports [0..=0]'
  });
  assert.match(compatibilityMessage, /Extension version:/, 'Expected protocol mismatch message to mention extension version');
  assert.match(compatibilityMessage, /supports protocol/, 'Expected protocol mismatch message to mention backend protocol range');
  assert.match(compatibilityMessage, /Remediation:/, 'Expected protocol mismatch message to include remediation guidance');

  const extensionRoot = process.cwd();
  const repoRoot = path.resolve(extensionRoot, '..', '..');

  const emittedFiles = [
    path.join(extensionRoot, 'dist', 'extension.js'),
    path.join(extensionRoot, 'dist', 'debugAdapter.js'),
    path.join(extensionRoot, 'dist', 'cli', 'debuggerProcess.js')
  ];

  for (const file of emittedFiles) {
    assert.ok(fs.existsSync(file), `Missing compiled artifact: ${file}`);
  }

  const binaryPath = process.env.SOROBAN_DEBUG_BIN
    || path.join(repoRoot, 'target', 'debug', process.platform === 'win32' ? 'soroban-debug.exe' : 'soroban-debug');

  if (!fs.existsSync(binaryPath)) {
    console.log(`Skipping debugger smoke test because the CLI binary was not found at ${binaryPath}`);
    return;
  }

  const contractPath = path.join(repoRoot, 'tests', 'fixtures', 'wasm', 'echo.wasm');
  assert.ok(fs.existsSync(contractPath), `Missing fixture WASM: ${contractPath}`);

  const debuggerProcess = new DebuggerProcess({
    binaryPath,
    contractPath,
    entrypoint: 'echo',
    args: ['7']
  });

  await debuggerProcess.start();
  await debuggerProcess.ping();

  const sourcePath = path.join(repoRoot, 'tests', 'fixtures', 'contracts', 'echo', 'src', 'lib.rs');
  const exportedFunctions = await debuggerProcess.getContractFunctions();
  const resolvedBreakpoints = resolveSourceBreakpoints(sourcePath, [10], exportedFunctions);
  assert.equal(resolvedBreakpoints[0].verified, true, 'Expected echo breakpoint to resolve');
  assert.equal(resolvedBreakpoints[0].functionName, 'echo');

  await debuggerProcess.setBreakpoint('echo');
  const paused = await debuggerProcess.execute();
  assert.equal(paused.paused, true, 'Expected breakpoint to pause before execution');

  const pausedInspection = await debuggerProcess.inspect();
  assert.match(pausedInspection.args || '', /7/, 'Expected paused inspection to include call args');

  const resumed = await debuggerProcess.continueExecution();
  assert.match(resumed.output || '', /7/, 'Expected continue() to finish echo()');
  await debuggerProcess.clearBreakpoint('echo');

  const result = await debuggerProcess.execute();
  assert.match(result.output, /7/, 'Expected second echo() to return the input');

  const inspection = await debuggerProcess.inspect();
  assert.ok(Array.isArray(inspection.callStack), 'Expected call stack array from inspection');
  assert.match(inspection.args || '', /7/, 'Expected inspection to include args');

  const storage = await debuggerProcess.getStorage();
  assert.ok(typeof storage === 'object' && storage !== null, 'Expected storage snapshot object');

  await debuggerProcess.stop();
  console.log('VS Code extension smoke tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
