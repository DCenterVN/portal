import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";

type StepResult = { title: string; passed: boolean };
type AccountResult = { title: string; status: TestResult["status"]; video?: string; steps: StepResult[] };

const DEFAULT_OUTPUT = "/home/dawn/work/ticket/.cache/video-nghiep-vu/07-tai-khoan/hoso";

export default class RedactReporter implements Reporter {
  private results: AccountResult[] = [];
  onTestEnd(test: TestCase, result: TestResult) {
    const steps = result.steps.filter(step => step.category === "test.step");
    const output = resolve(process.env.E2E_OUTPUT_DIR || DEFAULT_OUTPUT);
    mkdirSync(output, { recursive: true });
    const videoAttachment = result.attachments.find(a => a.name === "video");
    let videoPath = videoAttachment?.path;
    if (videoPath && existsSync(videoPath)) {
      const filename = test.title.startsWith("05") ? "video-hoso.webm" : test.title.startsWith("01") ? "1-khach.webm" : test.title.startsWith("02") ? "1b-khach-bao-mat.webm" : test.title.includes("Nhân viên") ? "2-nhan-vien.webm" : "4-chup-anh.webm";
      const target = resolve(output, filename);
      copyFileSync(videoPath, target);
      videoPath = target;
    }
    this.results.push({ title: test.title, status: result.status, video: videoPath, steps: steps.map(step => ({ title: step.title, passed: !step.error })) });
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
      resolve(process.env.E2E_REPORT_DIR || "node_modules/.cache/account-report"),
    ], { stdio: "inherit" });
    if (result.status !== 0) throw Error("Không lọc được thông tin bảo mật khỏi artifacts");
  }
}
