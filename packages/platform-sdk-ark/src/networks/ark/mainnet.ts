import { Coins } from "@arkecosystem/platform-sdk";

const network: Coins.CoinNetwork = {
	id: "ark.mainnet",
	type: "live",
	name: "ARK Mainnet",
	explorer: "https://explorer.ark.io/",
	currency: {
		ticker: "ARK",
		symbol: "Ѧ",
	},
	crypto: {
		slip44: 111,
		signingMethods: {
			mnemonic: true,
			wif: true,
		},
	},
	networking: {
		hosts: ["https://wallets.ark.io"],
		hostsMultiSignature: ["https://musig1.ark.io"],
	},
	governance: {
		voting: {
			enabled: true,
			delegateCount: 51,
			maximumPerWallet: 1,
			maximumPerTransaction: 1,
		},
	},
	featureFlags: {
		Client: {
			transaction: true,
			transactions: true,
			wallet: true,
			wallets: true,
			delegate: true,
			delegates: true,
			votes: true,
			voters: true,
			configuration: true,
			fees: true,
			syncing: true,
			broadcast: true,
		},
		Fee: {
			all: true,
		},
		Identity: {
			address: {
				mnemonic: true,
				multiSignature: true,
				publicKey: true,
				privateKey: true,
				wif: true,
			},
			publicKey: {
				mnemonic: true,
				multiSignature: true,
				wif: true,
			},
			privateKey: {
				mnemonic: true,
				wif: true,
			},
			wif: {
				mnemonic: true,
			},
			keyPair: {
				mnemonic: true,
				privateKey: false,
				wif: true,
			},
		},
		Ledger: {
			getVersion: true,
			getPublicKey: true,
			signTransaction: true,
			signMessage: true,
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
		Peer: {
			search: true,
		},
		Transaction: {
			transfer: true,
			secondSignature: true,
			delegateRegistration: true,
			vote: true,
			multiSignature: true,
			ipfs: true,
			multiPayment: true,
			delegateResignation: true,
			htlcLock: false,
			htlcClaim: false,
			htlcRefund: false,
		},
		Miscellaneous: {
			customPeer: true,
			dynamicFees: true,
			memo: true,
		},
		Derivation: {
			bip39: true,
			bip44: true,
		},
	},
	transactionTypes: [
		"bridgechain-registration",
		"bridgechain-resignation",
		"bridgechain-update",
		"business-registration",
		"business-resignation",
		"business-update",
		"delegate-registration",
		"delegate-resignation",
		"entity-registration",
		"entity-resignation",
		"entity-update",
		"htlc-claim",
		"htlc-lock",
		"htlc-refund",
		"ipfs",
		"multi-payment",
		"multi-signature",
		"second-signature",
		"transfer",
		"vote",
	],
	knownWallets: "https://raw.githubusercontent.com/ArkEcosystem/common/master/mainnet/known-wallets-extended.json",
};

export default network;
