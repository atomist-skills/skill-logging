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

export const initLoggingMiddleware = loggingMiddleware;

function loggingMiddleware(): void {
	try {
		let expressPackageName = "express";
		const cache = require.cache;

		// Load the express dependency dynamically from where it originally was resolved
		for (const name of Object.keys(cache)) {
			if (
				name.endsWith("express/index.js") &&
				!name.includes("@google-cloud/logging")
			) {
				expressPackageName = name;
				break;
			}
		}

		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const express = require(expressPackageName);

		if (!express?.application) {
			return;
		}

		const { post: originalPost, all: originalAll } = express.application;

		const middleware = (req, res, next) => {
			const traceId = req.get("x-cloud-trace-context");
			const executionId = req.get("function-execution-id");
			setTraceIds(
				traceId ? traceId.split("/")[0] : undefined,
				executionId,
			);
			next();
		};

		express.application.post = function post(path, ...rest) {
			this.use(middleware);
			return originalPost.bind(this)(path, ...rest);
		};
		express.application.all = function post(path, ...rest) {
			this.use(middleware);
			return originalAll.bind(this)(path, ...rest);
		};
	} catch (e) {
		// Intentionally left empty
	}
}

loggingMiddleware();

let traceIds;

function setTraceIds(traceId: string, executionId: string): void {
	traceIds = {
		traceId,
		executionId,
	};
}

export function clearTraceIds(): void {
	traceIds = undefined;
}

export function getTraceIds(): { traceId: string; executionId: string } {
	return traceIds;
}
