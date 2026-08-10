// FILE: CursorAdapter.test.ts
// Purpose: Characterizes Cursor's private Zog host-policy delivery.
// Layer: Provider adapter tests

import { ZOG_HARNESS_POLICY_MARKER } from "../../agentGateway/harnessPolicy.ts";
import { describe, expect, it } from "vitest";

import { takeCursorZogHarnessPolicyTextPart } from "./CursorAdapter.ts";

describe("Cursor Zog harness policy", () => {
  it("delivers scoped MCP host context exactly once per fresh/load/fork session", () => {
    for (const lifecycle of ["fresh", "load", "fork"] as const) {
      const state: { harnessPolicyDelivered?: boolean } = {};
      const first = takeCursorZogHarnessPolicyTextPart(state, true);
      expect(first?.text, lifecycle).toContain(ZOG_HARNESS_POLICY_MARKER);
      expect(first?.text, lifecycle).toContain("Use the zog_* tools");
      expect(takeCursorZogHarnessPolicyTextPart(state, true), lifecycle).toBeNull();
    }
  });

  it("stays truthful without a scoped gateway connection", () => {
    expect(takeCursorZogHarnessPolicyTextPart({}, false)?.text).toContain(
      "Zog MCP control is unavailable",
    );
  });
});
