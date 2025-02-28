import { Http } from "@arkecosystem/platform-sdk";
import nock from "nock";

import { Request } from "./request";

let subject: Request;

beforeAll(() => {
	nock.disableNetConnect();

	subject = new Request();
});

describe("Request", () => {
	it("should get with params", async () => {
		const responseBody = {
			args: { key: "value" },
			origin: "87.95.132.111,10.100.91.201",
			url: "http://httpbin.org/get",
		};

		nock("http://httpbin.org/").get("/get").query(true).reply(200, responseBody);

		const response = await subject.get("http://httpbin.org/get", { key: "value" });

		expect(response.json()).toEqual(responseBody);
	});

	it("should get without params", async () => {
		const responseBody = {
			args: {},
			origin: "87.95.132.111,10.100.91.201",
			url: "http://httpbin.org/get",
		};

		nock("http://httpbin.org/").get("/get").reply(200, responseBody);

		const response = await subject.get("http://httpbin.org/get");

		expect(response.json()).toEqual(responseBody);
	});

	it("should post with body", async () => {
		const responseBody = {
			args: {},
			data: '{"key":"value"}',
			files: {},
			form: {},
			json: {
				key: "value",
			},
			origin: "87.95.132.111,10.100.91.201",
			url: "http://httpbin.org/post",
		};

		nock("http://httpbin.org/").post("/post").reply(200, responseBody);

		const response = await subject.post("http://httpbin.org/post", { key: "value" });

		expect(response.json()).toEqual(responseBody);
	});

	it("should post with headers", async () => {
		const responseBody = {
			args: {},
			data: '{"key":"value"}',
			files: {},
			form: {},
			headers: { Authorization: "Bearer TOKEN" },
			json: {
				key: "value",
			},
			origin: "87.95.132.111,10.100.91.201",
			url: "http://httpbin.org/post",
		};

		nock("http://httpbin.org/").post("/post").reply(200, responseBody);

		const response = await subject
			.asJson()
			.withHeaders({ Authorization: "Bearer TOKEN" })
			.post("http://httpbin.org/post", { key: "value" });

		expect(response.json()).toEqual(responseBody);
	});

	it("should post with form_params", async () => {
		const responseBody = {
			args: {},
			data: '{"key":"value"}',
			files: {},
			form: {
				key: "value",
			},
			json: {},
			origin: "87.95.132.111,10.100.91.201",
			url: "http://httpbin.org/post",
		};

		nock("http://httpbin.org/").post("/post").reply(200, responseBody);

		const response = await subject.asForm().post("http://httpbin.org/post", { key: "value" });

		expect(response.json()).toEqual(responseBody);
	});

	it("should post with octet", async () => {
		const responseBody = {
			args: {},
			data: '{"key":"value"}',
			files: {},
			form: {
				key: "value",
			},
			json: {},
			origin: "87.95.132.111,10.100.91.201",
			url: "http://httpbin.org/post",
		};

		nock("http://httpbin.org/").post("/post").reply(200, responseBody);

		const response = await subject
			.bodyFormat("octet")
			.post("http://httpbin.org/post", Buffer.from(JSON.stringify({ key: "value" })));

		expect(response.json()).toEqual(responseBody);
	});

	it("should handle 404s", async () => {
		nock("http://httpbin.org/").get("/get").reply(404);

		await expect(subject.get("http://httpbin.org/get")).rejects.toThrow(Http.RequestException);
	});
});
