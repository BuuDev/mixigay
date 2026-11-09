#!/usr/bin/env bash
# PreToolUse hook for Agent and Workflow: any use of Claude Fable needs the user's
# explicit approval (docs/09-ai-tooling.md). Turns such a call into a permission prompt.
input=$(cat)
uses_fable=$(printf '%s' "$input" | jq -r '
  .tool_input as $t
  | [ ($t.model // ""), ($t.subagent_type // ""), ($t.script // "") ]
  | map(ascii_downcase) | join(" ")
  | test("fable")')
if [ "$uses_fable" = "true" ]; then
  jq -n '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "ask",
    permissionDecisionReason: "Dự án quy định: Fable chỉ dùng khi bạn ra lệnh hoặc đồng ý. Duyệt lần gọi này?"}}'
fi
exit 0
