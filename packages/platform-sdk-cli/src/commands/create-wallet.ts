import { BIP39 } from "@arkecosystem/platform-sdk-crypto";
import { Profile } from "@arkecosystem/platform-sdk-profiles";
import prompts from "prompts";

import { renderLogo } from "../helpers";

export const createWallet = async (profile: Profile): Promise<void> => {
	renderLogo();

	const { command, asset } = await prompts([
		{
			type: "select",
			name: "command",
			message: "Please choose an action:",
			choices: [
				{ title: "Import by address", value: "address" },
				{ title: "Import by mnemonic", value: "mnemonic" },
				{ title: "Exit", value: "exit" },
			],
			initial: 0,
		},
		{
			type: "select",
			name: "asset",
			message: "Please choose an asset:",
			choices: [
				{ title: "ARK (Development)", value: ["ARK", "ark.devnet"] },
				{ title: "AVAX (Development)", value: ["AVAX", "avax.testnet"] },
				{ title: "DOT (Development)", value: ["DOT", "dot.testnet"] },
				{ title: "EGLD (Development)", value: ["EGLD", "egld.testnet"] },
				{ title: "LSK (Development)", value: ["LSK", "lsk.testnet"] },
				// { title: "SOL (Development)", value: ["SOL", "sol.testnet"] },
				{ title: "Exit", value: "exit" },
			],
			initial: 0,
		},
	]);

	if (command === "exit") {
		return;
	}

	if (command === "address") {
		const { address } = await prompts({
			type: "text",
			name: "address",
			message: "Please enter your address:",
			validate: (value: string) => value !== undefined,
		});

		await profile.wallets().importByAddress(address, asset[0], asset[1]);
	}

	if (command === "mnemonic") {
		const { mnemonic } = await prompts({
			type: "password",
			name: "mnemonic",
			message: "Please enter your mnemonic:",
			validate: (value: string) => BIP39.validate(value),
		});

		if (!mnemonic) {
			return;
		}

		await profile.wallets().importByMnemonic(mnemonic, asset[0], asset[1]);
	}
};
