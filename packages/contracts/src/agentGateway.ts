/**
 * Public contracts for the Zog agent-control gateway.
 *
 * New gateway tools decode these schemas before doing any work. Keeping the
 * limits here ensures the MCP surface, server implementation, and tests share
 * the same definition of an exact creation/wait plan.
 */
import { Schema } from "effect";

import { ProjectId, ThreadId, TurnId } from "./baseSchemas";
import { ModelSelection, ProviderKind } from "./orchestration";
import { ProviderModelDescriptor } from "./providerDiscovery";
import { ServerProviderAuthStatus } from "./server";

export const ZOG_GATEWAY_MAX_THREADS_PER_OPERATION = 20;
export const ZOG_GATEWAY_MAX_REQUEST_ID_LENGTH = 256;
export const ZOG_GATEWAY_MAX_WAIT_MS = 60_000;

export const ZogGatewayErrorCode = Schema.Literals([
  "caller_session_inactive",
  "caller_turn_inactive",
  "capability_denied",
  "provider_unavailable",
  "model_unavailable",
  "model_option_unavailable",
  "idempotency_conflict",
  "creation_plan_locked",
  "creation_limit_exceeded",
  "thread_not_found",
  "wait_timed_out",
  "operation_failed",
]);
export type ZogGatewayErrorCode = typeof ZogGatewayErrorCode.Type;

export const ZogGatewayError = Schema.Struct({
  code: ZogGatewayErrorCode,
  message: Schema.String,
  details: Schema.optional(Schema.Unknown),
});
export type ZogGatewayError = typeof ZogGatewayError.Type;

export const ZogGatewayErrorResult = Schema.Struct({
  error: ZogGatewayError,
});
export type ZogGatewayErrorResult = typeof ZogGatewayErrorResult.Type;

export const ZogContextResult = Schema.Struct({
  harness: Schema.Struct({
    name: Schema.Literal("Zog"),
    policyVersion: Schema.String,
  }),
  caller: Schema.Struct({
    threadId: ThreadId,
    turnId: Schema.NullOr(TurnId),
    provider: ProviderKind,
    projectId: ProjectId,
  }),
  capabilities: Schema.Struct({
    threadRead: Schema.Boolean,
    threadCreate: Schema.Boolean,
    threadWait: Schema.Boolean,
    automations: Schema.Boolean,
  }),
});
export type ZogContextResult = typeof ZogContextResult.Type;

export const ZogCreateThreadSpec = Schema.Struct({
  prompt: Schema.String.check(Schema.isNonEmpty()),
  title: Schema.optional(Schema.String.check(Schema.isNonEmpty())),
  target: ModelSelection,
  projectId: Schema.optional(ProjectId),
  environment: Schema.optional(Schema.Literals(["local", "worktree"])),
  baseRef: Schema.optional(Schema.String.check(Schema.isNonEmpty())),
  // Legacy inputs remain decodable for replay/backward compatibility, but the
  // MCP catalog no longer advertises branch-backed worktree creation.
  baseBranch: Schema.optional(Schema.String.check(Schema.isNonEmpty())),
  branchName: Schema.optional(Schema.String.check(Schema.isNonEmpty())),
  runtimeMode: Schema.optional(Schema.Literals(["approval-required", "full-access"])),
});
export type ZogCreateThreadSpec = typeof ZogCreateThreadSpec.Type;

const ZogGatewayRequestId = Schema.String.check(Schema.isNonEmpty()).check(
  Schema.isMaxLength(ZOG_GATEWAY_MAX_REQUEST_ID_LENGTH),
);

export const ZogCreateThreadsInput = Schema.Struct({
  requestId: ZogGatewayRequestId,
  threads: Schema.Array(ZogCreateThreadSpec)
    .check(Schema.isMinLength(1))
    .check(Schema.isMaxLength(ZOG_GATEWAY_MAX_THREADS_PER_OPERATION)),
}).annotate({ parseOptions: { onExcessProperty: "error" } });
export type ZogCreateThreadsInput = typeof ZogCreateThreadsInput.Type;

export const ZogProviderCatalog = Schema.Struct({
  provider: ProviderKind,
  defaultModel: Schema.NullOr(Schema.String),
  models: Schema.Array(ProviderModelDescriptor),
  enabled: Schema.Boolean,
  available: Schema.Boolean,
  authStatus: Schema.optional(ServerProviderAuthStatus),
  source: Schema.optional(Schema.String),
  error: Schema.optional(Schema.String),
});
export type ZogProviderCatalog = typeof ZogProviderCatalog.Type;

export const ZogGatewayTargetOptionValue = Schema.Union([
  Schema.String,
  Schema.Number,
  Schema.Boolean,
]);
export type ZogGatewayTargetOptionValue = typeof ZogGatewayTargetOptionValue.Type;

export const ZogGatewayTargetOptionRule = Schema.Struct({
  key: Schema.String,
  valueType: Schema.Literals(["string", "number", "boolean"]),
  allowedValues: Schema.Array(ZogGatewayTargetOptionValue),
  allowedValuesSource: Schema.Literals(["provider-contract", "model-discovery"]),
});
export type ZogGatewayTargetOptionRule = typeof ZogGatewayTargetOptionRule.Type;

export const ZogGatewayTargetConstruction = Schema.Struct({
  modelValueSource: Schema.Literal("providers[].models[].slug"),
  primaryOptionKey: Schema.String,
  alternativeOptionKeys: Schema.Array(Schema.String),
  optionSelectionRule: Schema.String,
  providerOptions: Schema.Array(ZogGatewayTargetOptionRule),
  optionsByModel: Schema.Record(Schema.String, Schema.Array(ZogGatewayTargetOptionRule)),
  exampleTarget: Schema.NullOr(ModelSelection),
});
export type ZogGatewayTargetConstruction = typeof ZogGatewayTargetConstruction.Type;

export const ZogCapabilitiesResult = Schema.Struct({
  targetConstruction: Schema.Record(Schema.String, ZogGatewayTargetConstruction),
  providers: Schema.Array(ZogProviderCatalog),
  limits: Schema.Struct({
    maxThreadsPerOperation: Schema.Int,
    maxWaitMs: Schema.Int,
    oneCreationPlanPerActiveTurn: Schema.Boolean,
  }),
});
export type ZogCapabilitiesResult = typeof ZogCapabilitiesResult.Type;

export const ZogCreatedThreadResult = Schema.Struct({
  index: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  threadId: ThreadId,
  projectId: ProjectId,
  title: Schema.String,
  target: ModelSelection,
  provider: ProviderKind,
  model: Schema.String,
  runtimeMode: Schema.Literals(["approval-required", "full-access"]),
  environment: Schema.Literals(["local", "worktree"]),
  branch: Schema.NullOr(Schema.String),
  worktreePath: Schema.NullOr(Schema.String),
  status: Schema.Literal("task_dispatched"),
});
export type ZogCreatedThreadResult = typeof ZogCreatedThreadResult.Type;

export const ZogCreateThreadsResult = Schema.Struct({
  operationId: Schema.String,
  requestId: ZogGatewayRequestId,
  requestedCount: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)),
  createdCount: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  threadIds: Schema.Array(ThreadId),
  threads: Schema.Array(ZogCreatedThreadResult),
});
export type ZogCreateThreadsResult = typeof ZogCreateThreadsResult.Type;

export const ZogWaitForThreadsInput = Schema.Struct({
  threadIds: Schema.Array(ThreadId)
    .check(Schema.isMinLength(1))
    .check(Schema.isMaxLength(ZOG_GATEWAY_MAX_THREADS_PER_OPERATION)),
  runIds: Schema.optional(
    Schema.Array(Schema.NullOr(TurnId)).check(
      Schema.isMaxLength(ZOG_GATEWAY_MAX_THREADS_PER_OPERATION),
    ),
  ),
  timeoutMs: Schema.optional(
    Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)).check(
      Schema.isLessThanOrEqualTo(ZOG_GATEWAY_MAX_WAIT_MS),
    ),
  ),
}).annotate({ parseOptions: { onExcessProperty: "error" } });
export type ZogWaitForThreadsInput = typeof ZogWaitForThreadsInput.Type;

export const ZogWaitedThreadResult = Schema.Struct({
  threadId: ThreadId,
  runId: Schema.NullOr(TurnId),
  state: Schema.Literals(["idle", "pending", "running", "completed", "error", "interrupted"]),
  terminal: Schema.Boolean,
  timedOut: Schema.Boolean,
  summary: Schema.NullOr(Schema.String),
  summaryTruncated: Schema.Boolean,
  error: Schema.NullOr(Schema.String),
  readThread: Schema.Struct({
    tool: Schema.Literal("zog_read_thread"),
    arguments: Schema.Struct({ threadId: ThreadId }),
  }),
});
export type ZogWaitedThreadResult = typeof ZogWaitedThreadResult.Type;

export const ZogWaitForThreadsResult = Schema.Struct({
  callerThreadId: ThreadId,
  runIds: Schema.Array(Schema.NullOr(TurnId)),
  allTerminal: Schema.Boolean,
  timedOut: Schema.Boolean,
  threads: Schema.Array(ZogWaitedThreadResult),
});
export type ZogWaitForThreadsResult = typeof ZogWaitForThreadsResult.Type;
