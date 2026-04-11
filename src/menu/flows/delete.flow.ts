import * as clack from "@clack/prompts"
import * as pc from "../../ui/ansi.ts"
import { deleteImportedFlow } from "./delete-imported.flow.ts"
import { deleteGlobalFlow } from "./delete-global.flow.ts"
import type { FlowResult } from "../flow-result.ts"
import { FLOW_BACK, FLOW_CANCELLED } from "../constants/flow-tokens.ts"

export async function deleteFlow(): Promise<FlowResult> {
  while (true) {
    const action = await clack.select({
      message: "Delete skills:",
      options: [
        { value: "imported", label: "Delete imported skill(s)", hint: "→ imported skills" },
        { value: "global", label: "Delete globally installed skill(s)", hint: "→ known skills" },
        { value: FLOW_BACK, label: pc.dim("← Back") },
      ],
    })

    if (clack.isCancel(action)) return FLOW_CANCELLED
    if (action === FLOW_BACK) return FLOW_BACK

    const result = action === "imported"
      ? await deleteImportedFlow()
      : await deleteGlobalFlow()

    if (result === FLOW_BACK) {
      continue
    }

    return result
  }
}
