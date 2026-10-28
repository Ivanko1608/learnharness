"use client";
import { CLAUDE_CODE_PROVIDER } from "@/src/core";
import { useModelCatalog } from "@/components/model-catalog";
import { notifySettingsSaved } from "@/components/settings-signal";
import { ConnectionRow } from "./connection-controls";

export function ClaudeCodeConnection({ labelClassName }: { labelClassName?: string }) {
	const { catalog } = useModelCatalog();
	const provider = catalog?.providers.find((p) => p.id === CLAUDE_CODE_PROVIDER);

	const status = provider === undefined ? "Checking…" : provider.keyPresent ? "CLI found" : "CLI not found";

	return <ConnectionRow label="Claude Code" labelClassName={labelClassName} testid="claude-code-connection" actionTestid="claude-code-check" action="Check again" disabled={catalog === undefined} onAction={() => notifySettingsSaved("keys")}>
		<span className="text-xs text-muted-foreground" data-testid="claude-code-status">{status}</span>
	</ConnectionRow>;
}
