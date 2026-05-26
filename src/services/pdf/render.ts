import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import logger from '@/src/libs/logger';

interface RenderOptions {
  /** Quarkdown source (`.qd`) contents. */
  source: string;
  /** Used in the temp filename for debugging / log correlation. */
  jobId: string;
}

interface RenderResult {
  pdf: Uint8Array;
}

const DEFAULT_BIN = 'quarkdown';
const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * Compiles a Quarkdown source to PDF via the `quarkdown` CLI.
 *
 * Quarkdown always writes its output to a directory (no stdout PDF stream), so
 * we run it against a temp working directory, then read the PDF back from disk.
 * The temp dir is removed on both success and failure.
 *
 * Required env:
 *  - QUARKDOWN_BIN (optional, default `quarkdown`) — path to the binary.
 *  - QUARKDOWN_TIMEOUT_MS (optional, default 60000).
 *  - QUARKDOWN_PDF_NO_SANDBOX (optional, set in container envs without Chrome
 *    sandbox).
 */
export async function renderQuarkdownToPdf(opts: RenderOptions): Promise<RenderResult> {
  const msg = 'pdfService.render - ';
  const bin = process.env.QUARKDOWN_BIN ?? DEFAULT_BIN;
  const timeoutMs = parseInt(
    process.env.QUARKDOWN_TIMEOUT_MS ?? `${DEFAULT_TIMEOUT_MS}`,
    10,
  );
  const noSandbox = isTruthy(process.env.QUARKDOWN_PDF_NO_SANDBOX);

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `quarkdown-${opts.jobId}-`));
  const sourcePath = path.join(workDir, 'source.qd');
  const outDir = path.join(workDir, 'out');
  await fs.writeFile(sourcePath, opts.source, 'utf8');
  await fs.mkdir(outDir, { recursive: true });

  // `global-read` lets Quarkdown read the logo (and any future asset) from
  // the project's `public/` directory — the .qd source lives in a tmp work
  // dir, so its "project" scope wouldn't reach into the app's repo. We
  // control both the source content and the asset paths server-side, so this
  // is safe.
  const args = ['c', sourcePath, '--pdf', '-o', outDir, '--allow', 'global-read'];
  if (noSandbox) args.push('--pdf-no-sandbox');

  logger.info(msg + 'spawn', { bin, args, jobId: opts.jobId });

  try {
    const { exitCode, stderr } = await runCommand(bin, args, timeoutMs);
    if (exitCode !== 0) {
      throw new Error(
        `Quarkdown exited with code ${exitCode}. stderr: ${stderr.slice(0, 500)}`,
      );
    }
    const pdfPath = await findFirstPdf(outDir);
    if (!pdfPath) {
      throw new Error('Quarkdown produced no PDF in the output directory.');
    }
    const buf = await fs.readFile(pdfPath);
    return { pdf: new Uint8Array(buf) };
  } finally {
    fs.rm(workDir, { recursive: true, force: true }).catch((err) => {
      logger.warn(msg + 'failed to clean temp dir', {
        workDir,
        error: (err as Error).message,
      });
    });
  }
}

function isTruthy(v: string | undefined): boolean {
  if (!v) return false;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
}

interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function runCommand(bin: string, args: string[], timeoutMs: number): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const stdoutCap = 4096;
    const stderrCap = 4096;
    child.stdout.on('data', (chunk: Buffer) => {
      if (stdout.length < stdoutCap) stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      if (stderr.length < stderrCap) stderr += chunk.toString('utf8');
    });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Quarkdown timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.once('error', (err) => {
      clearTimeout(timer);
      // ENOENT means the binary isn't on PATH — surface a clearer message.
      const e = err as NodeJS.ErrnoException;
      if (e.code === 'ENOENT') {
        reject(new Error(`Quarkdown binary not found (${bin}). Set QUARKDOWN_BIN.`));
      } else {
        reject(err);
      }
    });
    child.once('close', (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code ?? -1, stdout, stderr });
    });
  });
}

async function findFirstPdf(dir: string): Promise<string | null> {
  // Quarkdown nests the PDF under `<outDir>/<docname>/<docname>.pdf` in recent
  // versions — walk shallowly to find the first .pdf produced.
  const stack: string[] = [dir];
  while (stack.length) {
    const current = stack.pop()!;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
        return abs;
      }
    }
  }
  return null;
}

export const TEMP_JOB_ID = () => randomUUID();
