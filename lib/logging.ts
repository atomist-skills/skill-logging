/*
 * Copyright © 2021 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Entry, Logging } from "@google-cloud/logging";
import * as Queue from "better-queue";
import * as os from "os";
import * as util from "util";

import { clearTraceIds, getTraceIds } from "./middleware";

/**
 * Logging object suitable for submitting Skill logs.
 *
 * This implementation logs to Google Cloud Logging and will fall back
 * to console logging in environments where Google Cloud Logging is not
 * available.
 */
export interface Logger {
	/**
	 * Log a message at debug level
	 * @param msg the message to log
	 * @param parameters additional optional parameters. Refer to util.format.
	 */
	debug(msg: string, ...parameters: any[]): void;

	/**
	 * Log a message at info level
	 * @param msg the message to log
	 * @param parameters additional optional parameters. Refer to util.format.
	 */
	info(msg: string, ...parameters: any[]): void;

	/**
	 * Log a message at warn level
	 * @param msg the message to log
	 * @param parameters additional optional parameters. Refer to util.format.
	 */
	warn(msg: string, ...parameters: any[]): void;

	/**
	 * Log a message at error level
	 * @param msg the message to log
	 * @param parameters additional optional parameters. Refer to util.format.
	 */
	error(msg: string, ...parameters: any[]): void;

	/**
	 * Close this Logger instance.
	 *
	 * Note: calling close is very important to avoid loosing log messages
	 * that are queued from any of the log methods above and processed asynchronously.
	 */
	close(): Promise<void>;
}

/**
 * Create an instance of Logger from the current GCF context object
 * @param context the context parameter passed into the GCF handler entry point
 * @param labels additional labels to be added to the audit log
 */
export function createLogger(
	context: {
		eventId?: string;
		skillId: string;
		correlationId: string;
		workspaceId: string;
	},
	labels: Record<string, any> = {},
	name = "skills_logging",
	project?: string,
): Logger {
	if (
		!context ||
		!context.correlationId ||
		!context.workspaceId ||
		!context.skillId
	) {
		throw new Error(
			`Provided context is missing correlationId, workspaceId, skillId: ${JSON.stringify(
				context,
			)}`,
		);
	}

	const logging = new Logging({
		projectId: project,
	});
	const log = logging.log(name);

	let skipGl = false;
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const Store = require("better-queue-memory");
	const logQueue = new Queue<Entry, Promise<void>>({
		store: new Store(),
		process: async (entries: Entry[], cb) => {
			const gl = async (cb: () => Promise<any>, fcb: () => void) => {
				if (skipGl) {
					fcb();
				} else {
					// Allow to write through to the console if requested
					if (process.env.ATOMIST_CONSOLE_LOG) {
						fcb();
					}
					try {
						await cb();
					} catch (e) {
						if (
							e.message.startsWith(
								"Unable to detect a Project Id in the current environment.",
							)
						) {
							fcb();
							skipGl = true;
						}
					}
				}
			};

			const filteredEntries = entries.filter(
				e => e.metadata.severity !== "EXIT",
			);

			await gl(
				() => log.write(filteredEntries),
				() => {
					filteredEntries.forEach(e =>
						console.log(
							`${severityToPrefix(
								e.metadata.severity.toString(),
							)}${e.data}`,
						),
					);
				},
			);

			cb();
		},
		concurrent: 1,
		batchSize: 10,
	});
	logQueue.resume();

	let closing = false;
	let started = false;
	const drained = new Promise<void>(resolve => {
		logQueue.on("drain", () => {
			if (closing) {
				resolve();
			}
		});
	});

	const queueLog = (msg: string, severity: string, ...parameters: any[]) => {
		started = true;
		const traceIds = getTraceIds();
		const metadata = {
			labels: {
				...labels,
				event_id: context.eventId,
				correlation_id: context.correlationId,
				workspace_id: context.workspaceId,
				skill_id: context.skillId,
				execution_id: traceIds?.executionId,
				trace_id: traceIds?.traceId,
				host: os.hostname(),
			},
			resource: {
				type: "global",
			},
			severity: severity.toUpperCase(),
		};

		const formattedMsg = util.format(msg, ...parameters);
		const entry = log.entry(metadata, formattedMsg);
		if (!formattedMsg) {
			entry.metadata = {
				...entry.metadata,
				...entry.data,
			};
			entry.data = formattedMsg;
		}

		logQueue.push(entry);
	};

	return {
		debug: (msg: string, ...parameters) =>
			queueLog(msg, "DEBUG", ...parameters),
		info: (msg: string, ...parameters) =>
			queueLog(msg, "INFO", ...parameters),
		warn: (msg: string, ...parameters) =>
			queueLog(msg, "WARNING", ...parameters),
		error: (msg: string, ...parameters) =>
			queueLog(msg, "ERROR", ...parameters),
		close: async () => {
			if (!started) {
				return Promise.resolve();
			}
			closing = true;
			queueLog("", "EXIT");
			clearTraceIds();
			return drained;
		},
	};
}

function severityToPrefix(severity: string): string {
	switch (severity) {
		case "DEBUG":
			return "[debug] ";
		case "INFO":
			return " [info] ";
		case "WARNING":
			return " [warn] ";
		case "ERROR":
			return "[error] ";
	}
	return "";
}
