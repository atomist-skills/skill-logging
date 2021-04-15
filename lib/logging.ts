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

import { Entry, Logging, Severity as GcpSeverity } from "@google-cloud/logging";
import * as Queue from "better-queue";

/**
 * Severity of User-facing skill logging
 *
 * Note: This starts at Info level because everything below should
 * be considered debug output considered for the skill author only.
 */
export enum Severity {
	Debug = GcpSeverity.debug,
	Info = GcpSeverity.info,
	Warning = GcpSeverity.warning,
	Error = GcpSeverity.error,
}

/**
 * Logging object suitable for submitting Skill audit logs
 */
export interface Logger {
	/**
	 * Log a certain message or object to the skill audit log
	 * @param msg simple string or array of strings to log
	 * @param severity severity of skill audit message
	 * @param labels additional labels to be added to the audit log
	 */
	log(
		msg: string | string[],
		severity?: Severity,
		labels?: Record<string, any>,
	): void;

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
	const logQueue = new Queue<
		{ entries: Entry[]; messages: string[]; severity: Severity },
		Promise<void>
	>({
		store: new Store(),
		process: async (
			entry: { entries: Entry[]; messages: string[]; severity: Severity },
			cb,
		) => {
			const cl = (e: string[], prefix: string, cb: (msg) => void) => {
				e.forEach(en => cb(`${prefix} ${en}`));
			};

			const gl = async (cb: () => Promise<any>, fcb: () => void) => {
				if (skipGl) {
					fcb();
				} else {
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

			switch (entry.severity) {
				case Severity.Debug:
					await gl(
						() => log.debug(entry.entries),
						() => cl(entry.messages, "[debug]", console.debug),
					);
					break;
				case Severity.Info:
					await gl(
						() => log.info(entry.entries),
						() => cl(entry.messages, " [info]", console.info),
					);
					break;
				case Severity.Warning:
					await gl(
						() => log.warning(entry.entries),
						() => cl(entry.messages, " [warn]", console.warn),
					);
					break;
				case Severity.Error:
					await gl(
						() => log.error(entry.entries),
						() => cl(entry.messages, "[error]", console.error),
					);
					break;
			}
			cb();
		},
		concurrent: 1,
		batchSize: 1,
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

	return {
		log: (msg, severity: Severity = Severity.Info, labelss = {}) => {
			started = true;
			const metadata = {
				labels: {
					...labels,
					...labelss,
					event_id: context.eventId,
					correlation_id: context.correlationId,
					workspace_id: context.workspaceId,
					skill_id: context.skillId,
				},
				resource: {
					type: "global",
				},
			};

			const entries = [];
			if (Array.isArray(msg)) {
				entries.push(...msg.map(m => log.entry(metadata, m)));
			} else {
				entries.push(log.entry(metadata, msg));
			}

			logQueue.push({
				entries,
				severity,
				messages: Array.isArray(msg) ? msg : [msg],
			});
		},
		close: async () => {
			if (!started) {
				return Promise.resolve();
			}
			closing = true;
			return drained;
		},
	};
}
