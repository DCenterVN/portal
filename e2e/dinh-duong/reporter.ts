import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";

const OUTPUT_DIR = "/home/dawn/work/ticket/.cache/video-nghiep-vu/10-dinh-duong/lan-1";

export default class DinhDuongReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    const videoAttachment = result.attachments.find((a) => a.name === "video");
    const videoPath = videoAttachment?.path;
    if (videoPath && existsSync(videoPath)) {
      const target = resolve(OUTPUT_DIR, "video-dinh-duong.webm");
      copyFileSync(videoPath, target);
    }
  }

  onEnd() {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}
