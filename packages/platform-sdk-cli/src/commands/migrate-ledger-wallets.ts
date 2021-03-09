import { BIP44, HDKey } from "@arkecosystem/platform-sdk-crypto";
import { Environment, Profile } from "@arkecosystem/platform-sdk-profiles";
import LedgerTransportNodeHID from "@ledgerhq/hw-transport-node-hid-singleton";
import Table from "cli-table3";
import ora from "ora";
import prompts from "prompts";

import { renderLogo, useLogger } from "../helpers";

const chunk = <T>(value: T[], size: number) =>
	Array.from({ length: Math.ceil(value.length / size) }, (v, i) => value.slice(i * size, i * size + size));

export const migrateLedgerWallets = async (env: Environment, profile: Profile): Promise<void> => {
	renderLogo();

	const { coin, network } = await prompts([
		{
			type: "text",
			name: "coin",
			message: "What is your coin?",
			validate: (value: string) => value !== undefined,
			initial: "ARK",
		},
		{
			type: "text",
			name: "network",
			message: "What is your network?",
			validate: (value: string) => value !== undefined,
			initial: "ark.devnet",
		},
	]);

	const slip44 = network === "ark.mainnet" ? 111 : 1;
	const instance = await env.coin(coin, network);

	await LedgerTransportNodeHID.create();

	try {
		const spinner = ora("Trying to connect...").start();

		await instance.ledger().connect(LedgerTransportNodeHID);

		await instance.ledger().getPublicKey(`m/44'/${slip44}'/0'/0/0`);

		spinner.stop();
	} catch (connectError) {
		console.log(connectError.message);

		await instance.ledger().disconnect();

		throw connectError;
	}

	LedgerTransportNodeHID.listen({
		// @ts-ignore
		next: async ({ type, deviceModel }) => {
			if (type === "add") {

				const addressList: any[] = [];

				const table = new Table({ head: ["Old Path", "Old Address", "Old Balance", "New Path", "New Address", "New Balance"] });

				for (let accountIndex = 0; accountIndex < 50; accountIndex++) {
					try {
						// Old Wallet
						const oldPath = `44'/${slip44}'/${accountIndex}'/0/0`;
						const oldPathKey = await instance.ledger().getPublicKey(`m/${oldPath}`);
						const oldPathAddress = await instance.identity().address().fromPublicKey(oldPathKey);
						const oldPathBalance = (await instance.client().wallet(oldPathAddress)).balance();
						const oldPathWallet = await profile.wallets().importByAddress(oldPathAddress, coin, network);
						oldPathWallet.syncIdentity();

						// New Wallet
						const newPath = `44'/${slip44}'/0'/0/${accountIndex}`;
						const newPathKey = HDKey.fromCompressedPublicKey(
							await instance
								.ledger()
								.getExtendedPublicKey(`m/44'/${slip44}'/${accountIndex}'`)
						).derive(`m/0/${accountIndex}`).publicKey.toString("hex");
						const newPathAddress = await instance.identity().address().fromPublicKey(newPathKey)

						// Test Transfer
						const input = {
							from: oldPathAddress,
							data: {
								amount: `${1e8}`,
								to: oldPathAddress,
							},
							sign: { senderPublicKey: oldPathKey },
						};
						const unsignedId = await oldPathWallet
							.transaction()
							.signTransfer(input, { unsignedBytes: true, unsignedJson: false });
						const unsignedTransaction = oldPathWallet.transaction().transaction(unsignedId);
						const bytes = Buffer.from(unsignedTransaction.toString(), "hex");
						const signature = await oldPathWallet.coin().ledger().signTransaction(oldPath, bytes);

						await oldPathWallet.transaction().broadcast(
							await oldPathWallet
								.transaction()
								.signTransfer({
									...input,
									nonce: oldPathWallet.nonce().plus(1).toFixed(),
									sign: {
										senderPublicKey: oldPathKey,
										signature,
									},
								}, { unsignedBytes: true, unsignedJson: false }),
						);

						process.exit();

						addressList.push({
							oldPath,
							oldPathAddress: oldPathAddress,
							oldPathBalance: oldPathBalance.toHuman(),
							newPath,
							newPathAddress: newPathAddress,
							newPathBalance: oldPathBalance.toHuman(), // @TODO: subtract fee
						});
					} catch {
						continue;
					}
				}

				for (const address of addressList) {
					table.push([
						address.oldPath,
						address.oldPathAddress,
						address.oldPathBalance,
						address.newPath,
						address.newPathAddress,
						address.newPathBalance,
					]);
				}

				console.log(table.toString());
			}

			if (type === "remove") {
				useLogger().info(`Disconnected [${deviceModel.productName}]`);
			}
		},
		error: (e) => console.log({ type: "failed", message: e.message }),
		complete: () => void 0,
	});
};
