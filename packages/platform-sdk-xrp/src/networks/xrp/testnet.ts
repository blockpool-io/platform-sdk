import { Coins } from "@arkecosystem/platform-sdk";

const network: Coins.CoinNetwork = {
	id: "xrp.testnet",
	type: "test",
	name: "Testnet",
	explorer: "https://testnet.xrpl.org/",
	currency: {
		ticker: "XRP",
		symbol: "XRP",
	},
	crypto: {
		slip44: 144,
		signingMethods: {
			mnemonic: true,
			privateKey: true,
		},
	},
	networking: {
		hosts: ["wss://s.altnet.rippletest.net/"],
	},
	governance: {
		voting: {
			enabled: false,
			delegateCount: 0,
			maximumPerWallet: 0,
			maximumPerTransaction: 0,
		},
	},
	featureFlags: {
		Client: {
			transaction: true,
			transactions: true,
			wallet: true,
			broadcast: true,
		},
		Identity: {
			address: {
				mnemonic: true,
				publicKey: true,
			},
			keyPair: {
				mnemonic: true,
			},
		},
		Link: {
			block: true,
			transaction: true,
			wallet: true,
		},
		Message: {
			sign: true,
			verify: true,
		},
		Transaction: {
			transfer: true,
		},
		Derivation: {
			bip39: true,
			bip44: true,
		},
	},
	transactionTypes: ["transfer"],
};

export default network;
