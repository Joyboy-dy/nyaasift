import { expect, test } from "bun:test";
import { healthSchema } from "./index";

test("healthSchema accepts only a healthy answer", () => {
  expect(healthSchema.safeParse({ ok: true }).success).toBe(true);
  expect(healthSchema.safeParse({ ok: false }).success).toBe(false);
});
