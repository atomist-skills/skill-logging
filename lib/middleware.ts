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
	console.log("Initialising logging middleware");

	const { post: originalPost } = express.application;

	const middleware = (req, res, next) => {
		console.log("Inside middleware");
		const traceId = req.get("x-cloud-trace-context");
		const executionId = req.get("function-execution-id");
		setTraceIds(traceId, executionId);
		next();
	};

	express.application.post = (path, ...rest) => {
		console.log("Inside post");
		this.use(middleware);
		return originalPost.bind(this)(path, ...rest);
	};
}

loggingMiddleware();

let traceIds;

function setTraceIds(traceId: string, executionId: string): void {
	console.log("setTraceIds %s %s", traceId, executionId);
	traceIds = {
		traceId,
		executionId,
	};
}

export function clearTraceIds(): void {
	console.log("clearTraceIds");
	traceIds = undefined;
}

export function getTraceIds(): { traceId: string; executionId: string } {
	console.log("getTraceIds %s", JSON.stringify(traceIds || {}));
	return traceIds;
}
