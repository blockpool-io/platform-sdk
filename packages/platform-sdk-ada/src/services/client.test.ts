import "jest-extended";

import { DTO } from "@arkecosystem/platform-sdk";
import { BigNumber } from "@arkecosystem/platform-sdk-support";
import nock from "nock";

import { createConfig } from "../../test/helpers";
import { SignedTransactionData, TransactionData, WalletData } from "../dto";
import { ClientService } from "./client";
import { TransactionService } from "./transaction";

jest.setTimeout(10000);

let subject: ClientService;

beforeEach(async () => (subject = await ClientService.__construct(createConfig())));

afterEach(() => nock.cleanAll());

// beforeAll(() => nock.disableNetConnect());

describe("ClientService", function () {
	it("#wallet should succeed", async () => {
		nock(/.+/)
			.post("/")
			.reply(200, require(`${__dirname}/../../test/fixtures/client/transactions-0.json`))
			.post("/")
			.reply(200, require(`${__dirname}/../../test/fixtures/client/transactions-20.json`))
			.post("/")
			.reply(200, require(`${__dirname}/../../test/fixtures/client/utxos-aggregate.json`));

		const result = await subject.wallet(
			"aec30330deaecdd7503195a0d730256faef87027022b1bdda7ca0a61bca0a55e4d575af5a93bdf4905a3702fadedf451ea584791d233ade90965d608bac57304",
		);

		expect(result).toBeInstanceOf(WalletData);
		expect(result.address()).toBe(
			"aec30330deaecdd7503195a0d730256faef87027022b1bdda7ca0a61bca0a55e4d575af5a93bdf4905a3702fadedf451ea584791d233ade90965d608bac57304",
		);
		expect(result.balance().toString()).toEqual("2024831199");
	});

	it("#transactions", async () => {
		nock(/.+/)
			.post("/")
			.reply(200, require(`${__dirname}/../../test/fixtures/client/transactions-0.json`))
			.post("/")
			.reply(200, require(`${__dirname}/../../test/fixtures/client/transactions-20.json`))
			.post("/")
			.reply(200, require(`${__dirname}/../../test/fixtures/client/transactions.json`));

		const result = await subject.transactions({
			walletId:
				"aec30330deaecdd7503195a0d730256faef87027022b1bdda7ca0a61bca0a55e4d575af5a93bdf4905a3702fadedf451ea584791d233ade90965d608bac57304",
		});

		expect(result).toBeObject();
		expect(result.items()).toBeArrayOfSize(5);
		expect(result.items()[0]).toBeInstanceOf(TransactionData);
	});

	it("#transaction", async () => {
		nock(/.+/)
			.post(/.*/)
			.reply(200, require(`${__dirname}/../../test/fixtures/client/transaction.json`));

		const result = await subject.transaction("35b40547f04963d3b41478fc27038948d74718802c486d9125f1884d8c83a31d");
		expect(result).toBeInstanceOf(TransactionData);
		expect(result.id()).toBe("35b40547f04963d3b41478fc27038948d74718802c486d9125f1884d8c83a31d");

		expect(result.blockId()).toBeUndefined();

		expect(result.timestamp()?.toISOString()).toBe("2021-02-05T15:04:16.000Z");

		expect(result.confirmations().toString()).toBe("0");

		expect(result.sender()).toBe(
			"addr_test1qrhvwtn8sa3duzkm93v5kjjxlv5lvg67j530wyeumngu23lk8ttq8f3gag0h89aepvx3xf69g0l9pf80tqv7cve0l33s4s8xvh",
		);

		expect(result.recipient()).toBe(
			"addr_test1qzct2hsralem3fqn8fupu90v3jkelpg4rfp4zqx06zgevpachk6az8jcydma5a6vgsuw5c37v0c8j6rlclpqajn2vxsq3rz4th",
		);

		const actual = result.recipients();
		expect(actual[0].address).toBe(
			"addr_test1qzct2hsralem3fqn8fupu90v3jkelpg4rfp4zqx06zgevpachk6az8jcydma5a6vgsuw5c37v0c8j6rlclpqajn2vxsq3rz4th",
		);
		expect(actual[0].amount.toString()).toBe("25000000");
		expect(actual[1].address).toBe(
			"addr_test1qzfjfm724nv9qz6nfyagmj0j2uppr35gzv5qee8s7489wxlk8ttq8f3gag0h89aepvx3xf69g0l9pf80tqv7cve0l33scc4thv",
		);
		expect(actual[1].amount.toString()).toBe("4831199");

		const inputs = result.inputs();
		expect(inputs).toBeArrayOfSize(1);
		expect(inputs[0]).toBeInstanceOf(DTO.UnspentTransactionData);
		expect(inputs[0].id()).toBe("6bf76f4380da8a389ae0a7ecccf1922b74ae11d773ba8b1b761d84a1b4474a4f");
		expect(inputs[0].amount()).toEqual(BigNumber.make(30000000));
		expect(inputs[0].addresses()).toEqual([
			"addr_test1qrhvwtn8sa3duzkm93v5kjjxlv5lvg67j530wyeumngu23lk8ttq8f3gag0h89aepvx3xf69g0l9pf80tqv7cve0l33s4s8xvh",
		]);

		const outputs = result.outputs();
		expect(outputs).toBeArrayOfSize(2);
		expect(outputs[0]).toBeInstanceOf(DTO.UnspentTransactionData);
		expect(outputs[0].amount().toString()).toBe("25000000");
		expect(outputs[0].addresses()).toEqual([
			"addr_test1qzct2hsralem3fqn8fupu90v3jkelpg4rfp4zqx06zgevpachk6az8jcydma5a6vgsuw5c37v0c8j6rlclpqajn2vxsq3rz4th",
		]);
		expect(outputs[1]).toBeInstanceOf(DTO.UnspentTransactionData);
		expect(outputs[1].amount().toString()).toBe("4831199");
		expect(outputs[1].addresses()).toEqual([
			"addr_test1qzfjfm724nv9qz6nfyagmj0j2uppr35gzv5qee8s7489wxlk8ttq8f3gag0h89aepvx3xf69g0l9pf80tqv7cve0l33scc4thv",
		]);

		expect(result.amount().toString()).toBe("25000000");

		expect(result.fee().toString()).toBe("168801");
	});

	describe("#broadcast", () => {
		it.only("#accepted", async () => {
			// nock(/.*/)
			// 	.post("/v2/proxy/transactions")
			// 	.reply(201);

			const txService = await TransactionService.__construct(createConfig());

			const transfer = await txService.transfer({
				from:
					"addr_test1qrhvwtn8sa3duzkm93v5kjjxlv5lvg67j530wyeumngu23lk8ttq8f3gag0h89aepvx3xf69g0l9pf80tqv7cve0l33s4s8xvh",
				sign: {
					mnemonic:
						"excess behave track soul table wear ocean cash stay nature item turtle palm soccer lunch horror start stumble month panic right must lock dress",
				},
				data: {
					amount: "9615699",
					to:
						"addr_test1qpgs3nex8wvaggzx9pnwjgh946e7zk3k8vc9lnf4jrk5fs4u9m4778wzj4rhddna0s2tszgz9neja69f4q6xwp2w6wqsnfunm6",
				},
			});

			const transactions = [transfer];
			console.log("transactions", JSON.stringify(transactions, null, 2));
			const result = await subject.broadcast(transactions);
			expect(result).toMatchObject({
				accepted: [],
				rejected: ["35e95e8851fb6cc2fadb988d0a6e514386ac7a82a0d40baca34d345740e9657f"],
				errors: {
					"35e95e8851fb6cc2fadb988d0a6e514386ac7a82a0d40baca34d345740e9657f":
						"HTTP request returned status code 400: Response code 400 (Bad Request)",
				},
			});
		});
		it("#rejected", async () => {
			nock(/.*/).post("/v2/proxy/transactions").reply(400);

			const transactions = [
				new SignedTransactionData(
					"35e95e8851fb6cc2fadb988d0a6e514386ac7a82a0d40baca34d345740e9657f",
					{
						sender:
							"addr_test1qpz03ezdyda8ag724zp3n5fqulay02dp7j9mweyeylcaapsxu2hyfhlkwuxupa9d5085eunq2qywy7hvmvej456flknscw3xw7",
						recipient:
							"addr_test1qpz03ezdyda8ag724zp3n5fqulay02dp7j9mweyeylcaapsxu2hyfhlkwuxupa9d5085eunq2qywy7hvmvej456flknscw3xw7",
						amount: "1000000",
						fee: "168273",
					},
					"83a4008182582022e6ff48fc1ed9d8ed87eb416b1c45e93b5945a3dc31d7d14ccdeb93174251f40001828258390044f8e44d237a7ea3caa88319d120e7fa47a9a1f48bb7649927f1de8606e2ae44dff6770dc0f4ada3cf4cf2605008e27aecdb332ad349fda71a000f42408258390044f8e44d237a7ea3caa88319d120e7fa47a9a1f48bb7649927f1de8606e2ae44dff6770dc0f4ada3cf4cf2605008e27aecdb332ad349fda71a3888e035021a00029151031a0121e3e0a10081825820cf779aa32f35083707808532471cb64ee41426c9bbd46134dac2ac5b2a0ec0e95840fecc6f5e8fbe05a00c60998476a9102463311ffeea5b890b3bbbb0a3c933a420ff50d9a951b11ca36a491eef32d164abf21fde26d53421ce68aff2d17372a20cf6",
				),
			];
			const result = await subject.broadcast(transactions);
			expect(result).toMatchObject({
				accepted: [],
				rejected: ["35e95e8851fb6cc2fadb988d0a6e514386ac7a82a0d40baca34d345740e9657f"],
				errors: {
					"35e95e8851fb6cc2fadb988d0a6e514386ac7a82a0d40baca34d345740e9657f":
						"HTTP request returned status code 400: Response code 400 (Bad Request)",
				},
			});
		});
	});

	describe("unimplemented methods", () => {
		it("#wallets", async () => {
			await expect(subject.wallets({})).rejects.toThrow(/is not implemented./);
		});

		it("#delegate", async () => {
			await expect(subject.delegate("")).rejects.toThrow(/is not implemented./);
		});

		it("#delegates", async () => {
			await expect(subject.delegates({})).rejects.toThrow(/is not implemented./);
		});

		it("#votes", async () => {
			await expect(subject.votes("")).rejects.toThrow(/is not implemented./);
		});

		it("#voters", async () => {
			await expect(subject.voters("", {})).rejects.toThrow(/is not implemented./);
		});

		it("#syncing", async () => {
			await expect(subject.syncing()).rejects.toThrow(/is not implemented./);
		});

		it("#broadcastSpread", async () => {
			await expect(subject.broadcastSpread([], [])).rejects.toThrow(/is not implemented./);
		});
	});
});
