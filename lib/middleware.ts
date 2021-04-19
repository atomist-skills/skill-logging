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

import * as express from "express";

function loggingMiddleware(): void {
	const app = express();
	app.use((req, res, next) => {
		const traceId = req.get("x-cloud-trace-context");
		const executionId = req.get("function-execution-id");
		setTraceIds(traceId, executionId);
		next();
	});
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
