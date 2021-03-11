import "jest-extended";

import { createConfig } from "../../test/helpers";
import { TransactionService } from "./transaction";
import { ClientService } from "./client";

let subject: TransactionService;
let client;

beforeEach(async () => {
	subject = await TransactionService.__construct(createConfig());
	client = await ClientService.__construct(createConfig());
});

jest.setTimeout(60000);

describe("TransactionService", () => {
	it("#transfer", async () => {
		const result = await subject.transfer({
			from:
				"98abc2190ee1c207d6e210d3db1a09d33e62978e31140d7f1b0ba945f67707e489a20787ade9e802837741df511c773163372530e2cdaf1f8b0d37f360c4c31c",
			sign: {
				mnemonic: "submit teach debate stool guilt pen problem inquiry horn tissue cradle ankle member quarter conduct obvious device ivory top wink globe tool rate tonight",
			},
			data: {
				amount: "1000000",
				to:
					"addr_test1qz39tdwlmz3zu9pe7xzpnac98u95e6un24qyardmrm6qnk4u9m4778wzj4rhddna0s2tszgz9neja69f4q6xwp2w6wqsgtex72",
			},
		});

		await client.broadcast([result]);
	});
});
