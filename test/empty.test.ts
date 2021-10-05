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

import * as fs from "fs";
import { fail } from "power-assert";
import * as util from "util";

import { chunk, createLogger } from "../lib/logging";

describe("test", () => {
	it("should close without entries", async () => {
		const logger = createLogger({
			skillId: Date.now().toString(),
			workspaceId: "T095SFFBK",
			correlationId: Date.now().toString(),
		});
		await logger.close();
	});
	it("should log and then close", async () => {
		const logger = createLogger({
			skillId: Date.now().toString(),
			workspaceId: "T095SFFBK",
			correlationId: Date.now().toString(),
		});
		for (let i = 0; i < 100; i++) {
			logger.debug("Test %d\n", i);
			logger.warn("");
			logger.error(undefined);
		}
		await logger.close();
	}).timeout(100000000);

	it("should log large text", async () => {
		const text = (
			await util.promisify(fs.readFile)("test/world192.txt")
		).toString();

		const l = 256000;
		const chunks = chunk(text, l);
		for (const c of chunks) {
			console.log(Buffer.byteLength(c));
			if (Buffer.byteLength(c) > l) {
				fail("too long");
			}
		}
	});
});
