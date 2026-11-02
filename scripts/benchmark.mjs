import { _electron as electron } from '@playwright/test';
import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'meldiq-bench-'));
const start = performance.now();
const client = await electron.launch({ args: ['.'], env: { ...process.env, MELDIQ_TEST_USER_DATA: profile } });
try {
  const page = await client.firstWindow();
  await page.getByRole('button', { name: 'Desktop settings', exact: true }).waitFor();
  const localShellMs = performance.now() - start;
  await page.waitForTimeout(30_000);
  const metrics = await client.evaluate(({ app }) => app.getAppMetrics().map(p => ({ type: p.type, cpuPercent: p.cpu.percentCPUUsage, workingSetKB: p.memory.workingSetSize, privateKB: p.memory.privateBytes })));
  const result = { recordedAt: new Date().toISOString(), platform: process.platform, release: os.release(), architecture: process.arch, ramGB: os.totalmem()/1024**3, logicalCpus: os.cpus().length, cpu: os.cpus()[0]?.model, scenario: 'fresh-profile local shell / signed-out idle at 30 seconds', startup: { localShellMs: Math.round(localShellMs), method: 'spawn to visible desktop settings launcher; includes Playwright overhead; single warm filesystem run' }, processes: metrics, aggregateWorkingSetMB: metrics.reduce((sum,p) => sum+p.workingSetKB,0)/1024, unmeasured: ['cold Windows launch', 'authenticated messaging', 'file handling', 'video calls', 'screen sharing', 'long-session stability'], publishableSystemRequirements: false };
  await fs.mkdir('benchmarks/results', { recursive: true });
  const filename = `benchmarks/results/${process.platform}-${Date.now()}.json`;
  await fs.writeFile(filename, JSON.stringify(result,null,2));
  console.log(filename); console.log(JSON.stringify(result,null,2));
} finally { await client.evaluate(({ app }) => app.exit(0)).catch(() => undefined); await client.close().catch(() => undefined); await fs.rm(profile,{recursive:true,force:true}); }
