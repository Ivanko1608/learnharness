import React, { act } from "react";
(globalThis as Record<string, unknown>).React = React;
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createRoot, type Root } from "react-dom/client";
import { parseHTML } from "linkedom";
import { ClaudeCodeConnection } from "../components/settings/claude-code-connection.tsx";
import { CLAUDE_CODE_PROVIDER, type ModelCatalogResponse } from "../src/core/index.ts";

const dom = parseHTML("<html><body></body></html>");
Object.assign(globalThis, {
	window: dom.window, document: dom.document, Element: dom.window.Element,
	HTMLElement: dom.window.HTMLElement, CustomEvent: dom.window.CustomEvent, IS_REACT_ACT_ENVIRONMENT: true,
});
const originalFetch = globalThis.fetch;
let root: Root | null = null;
let requests: Array<(body: ModelCatalogResponse) => void> = [];

function catalog(keyPresent: boolean): ModelCatalogResponse {
	return {
		models: [], defaults: null,
		rolePins: { researcher: null, demoBuilder: null, visualMaker: null, extractor: null, auditor: null },
		slots: { strong: null, cheap: null, vision: null },
		providers: [{ id: CLAUDE_CODE_PROVIDER, envVar: "", keyPresent }],
	};
}

function installFetch() {
	requests = [];
	globalThis.fetch = async (input) => {
		assert.equal(String(input), "/api/models");
		return new Promise<Response>((resolve) => { requests.push((body) => resolve(Response.json(body))); });
	};
}

async function answer(index: number, body: ModelCatalogResponse) {
	await act(async () => requests[index]!(body));
}

function text(testid: string): string | null {
	return document.querySelector(`[data-testid="${testid}"]`)?.textContent ?? null;
}

afterEach(async () => {
	await act(async () => root?.unmount());
	root = null;
	globalThis.fetch = originalFetch;
});

test("Claude Code row shows CLI status and Check again re-reads it", async () => {
	installFetch();
	const host = document.createElement("div");
	document.body.append(host);
	root = createRoot(host);

	await act(async () => root!.render(<ClaudeCodeConnection />));
	assert.equal(text("claude-code-status"), "Checking…");

	await answer(0, catalog(false));
	assert.equal(text("claude-code-status"), "CLI not found");

	await act(async () => document.querySelector<HTMLElement>('[data-testid="claude-code-check"]')!.click());
	assert.equal(requests.length, 2);
	await answer(1, catalog(true));
	assert.equal(text("claude-code-status"), "CLI found");
});
