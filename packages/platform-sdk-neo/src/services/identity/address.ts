import { Coins, Contracts, Exceptions } from "@arkecosystem/platform-sdk";

import { createWallet, deriveWallet } from "./utils";

export class Address implements Contracts.Address {
	readonly #config: Coins.Config;

	public constructor(config: Coins.Config) {
		this.#config = config;
	}

	public async fromMnemonic(mnemonic: string, options?: Contracts.IdentityOptions): Promise<string> {
		try {
			return deriveWallet(
				mnemonic,
				this.#config.get<number>("network.crypto.slip44"),
				options?.bip44?.account || 0,
				options?.bip44?.change || 0,
				options?.bip44?.addressIndex || 0,
			).address;
		} catch (error) {
			throw new Exceptions.CryptoException(error);
		}
	}

	public async fromMultiSignature(min: number, publicKeys: string[]): Promise<string> {
		throw new Exceptions.NotSupported(this.constructor.name, "fromMultiSignature");
	}

	public async fromPublicKey(publicKey: string, options?: Contracts.IdentityOptions): Promise<string> {
		try {
			return createWallet(publicKey).address;
		} catch (error) {
			throw new Exceptions.CryptoException(error);
		}
	}

	public async fromPrivateKey(privateKey: string, options?: Contracts.IdentityOptions): Promise<string> {
		try {
			return createWallet(privateKey).address;
		} catch (error) {
			throw new Exceptions.CryptoException(error);
		}
	}

	public async fromWIF(wif: string): Promise<string> {
		try {
			return createWallet(wif).address;
		} catch (error) {
			throw new Exceptions.CryptoException(error);
		}
	}

	public async validate(address: string): Promise<boolean> {
		try {
			if (this.#config.get(Coins.ConfigKey.NetworkId) === "neo.mainnet") {
				let response;

				try {
					response = (
						await this.#config
							.get<Contracts.HttpClient>("httpClient")
							.get(`https://explorer.ark.io/api/wallets/${address}`)
					).json();
				} catch {
					response = undefined;
				}

				if (response && response.data) {
					throw new Error("This address exists on the ARK Mainnet.");
				}
			}

			// TODO: implement actual validation of NEO addresses
			return address.length === 34;
		} catch (error) {
			throw new Exceptions.CryptoException(error);
		}
	}
}
