import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";

type StepResult = { title: string; passed: boolean; error?: string };
type Fc1Result = { title: string; status: TestResult["status"]; video?: string; steps: StepResult[] };

const DEFAULT_OUTPUT = "/home/dawn/work/ticket/.cache/video-nghiep-vu/08-chi-nhanh-phan-quyen/fc1";

export default class RedactReporter implements Reporter {
  private results: Fc1Result[] = [];
  onTestEnd(test: TestCase, result: TestResult) {
    const steps = result.steps.filter(step => step.category === "test.step");
    const output = resolve(process.env.E2E_OUTPUT_DIR || DEFAULT_OUTPUT);
    mkdirSync(output, { recursive: true });
    const videoAttachment = result.attachments.find(a => a.name === "video");
    let videoPath = videoAttachment?.path;
    if (videoPath && existsSync(videoPath)) {
      const target = resolve(output, "video-fc1.webm");
      copyFileSync(videoPath, target);
      videoPath = target;
    }
    this.results.push({
      title: test.title,
      status: result.status,
      video: videoPath,
      steps: steps.map(step => ({
        title: step.title,
        passed: !step.error,
        error: step.error?.message,
      })),
    });
  }
  onEnd() {
    const output = resolve(process.env.E2E_OUTPUT_DIR || DEFAULT_OUTPUT);
    mkdirSync(output, { recursive: true });
    writeFileSync(resolve(output, "summary.json"), JSON.stringify(this.results, null, 2));
  }
  async onExit() {
    const result = spawnSync("python3", [
      "e2e/account/redact-artifacts.py",
      resolve(process.env.E2E_OUTPUT_DIR || DEFAULT_OUTPUT),
      resolve(process.env.E2E_REPORT_DIR || "node_modules/.cache/fc1-report"),
    ], { stdio: "inherit" });
    if (result.status !== 0) throw Error("Không lọc được thông tin bảo mật khỏi artifacts");
  }
}
