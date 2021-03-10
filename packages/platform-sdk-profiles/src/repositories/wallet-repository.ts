import { Coins } from "@arkecosystem/platform-sdk";
import { BIP39 } from "@arkecosystem/platform-sdk-crypto";
import { sortBy, sortByDesc } from "@arkecosystem/utils";
import retry from "p-retry";
import { v4 as uuidv4 } from "uuid";

import { container } from "../environment/container";
import { Identifiers } from "../environment/container.models";
import { CoinService } from "../environment/services/coin-service";
import { Profile } from "../profiles/profile";
import { WalletExportOptions } from "../profiles/profile.models";
import { Wallet } from "../wallets/wallet";
import { WalletFactory } from "../wallets/wallet.factory";
import { ReadWriteWallet } from "../wallets/wallet.models";
import { DataRepository } from "./data-repository";

export class WalletRepository {
	#profile: Profile;
	#data: DataRepository;
	#wallets: WalletFactory;

	public constructor(profile: Profile) {
		this.#profile = profile;
		this.#data = new DataRepository();
		this.#wallets = new WalletFactory(profile);
	}

	public all(): Record<string, ReadWriteWallet> {
		return this.#data.all() as Record<string, ReadWriteWallet>;
	}

	public first(): ReadWriteWallet {
		return this.#data.first();
	}

	public last(): ReadWriteWallet {
		return this.#data.last();
	}

	public allByCoin(): Record<string, Record<string, ReadWriteWallet>> {
		const result = {};

		for (const [id, wallet] of Object.entries(this.all())) {
			const coin: string = wallet.currency();

			if (!result[coin]) {
				result[coin] = {};
			}

			result[coin][id] = wallet;
		}

		return result;
	}

	public keys(): string[] {
		return this.#data.keys();
	}

	public values(): ReadWriteWallet[] {
		return this.#data.values();
	}

	public async importByMnemonic(mnemonic: string, coin: string, network: string): Promise<ReadWriteWallet> {
		return this.storeWallet(await this.#wallets.fromMnemonic({ coin, network, mnemonic }));
	}

	public async importByAddress(address: string, coin: string, network: string): Promise<ReadWriteWallet> {
		return this.storeWallet(await this.#wallets.fromAddress({ coin, network, address }));
	}

	public async importByAddressList(addresses: string[], coin: string, network: string): Promise<ReadWriteWallet[]> {
		// Make sure we have an instance of the coin
		const service = await container.get<CoinService>(Identifiers.CoinService).push(coin, network);

		// Bulk request the addresses.
		const wallets: ReadWriteWallet[] = [];

		let hasMore = true;
		let lastResponse: Coins.WalletDataCollection | undefined;
		while (hasMore) {
			if (lastResponse) {
				lastResponse = await service
					.client()
					.wallets({ addresses: addresses, cursor: lastResponse.nextPage() });
			} else {
				lastResponse = await service.client().wallets({ addresses: addresses });
			}

			for (const wallet of lastResponse.items()) {
				const instance: ReadWriteWallet = new Wallet(uuidv4(), {}, this.#profile);
				await instance.setCoin(coin, network);
				await instance.setAddress(wallet.address());

				// @TODO: set already existing coin instance without bootstrapping again
				// @TODO: set address without hitting the network again

				wallets.push(instance);
			}

			hasMore = lastResponse.hasMorePages();
		}

		return wallets;
	}

	public async importByAddressWithLedgerPath(
		address: string,
		coin: string,
		network: string,
		path: string,
	): Promise<ReadWriteWallet> {
		return this.storeWallet(await this.#wallets.fromAddressWithLedgerPath({ coin, network, address, path }));
	}

	public async importByMnemonicWithEncryption(
		mnemonic: string,
		coin: string,
		network: string,
		password: string,
	): Promise<ReadWriteWallet> {
		return this.storeWallet(await this.#wallets.fromMnemonicWithEncryption({ coin, network, mnemonic, password }));
	}

	public async generate(coin: string, network: string): Promise<{ mnemonic: string; wallet: ReadWriteWallet }> {
		const mnemonic: string = BIP39.generate();

		return { mnemonic, wallet: await this.importByMnemonic(mnemonic, coin, network) };
	}

	public async restore(struct: Record<string, any>): Promise<ReadWriteWallet> {
		const { id, coin, network, networkConfig, address, data, settings } = struct;
		const previousWallet: ReadWriteWallet | undefined = this.findByAddress(address);

		if (previousWallet !== undefined) {
			if (previousWallet.hasBeenPartiallyRestored()) {
				try {
					await this.syncWalletWithNetwork({ address, coin, network, networkConfig, wallet: previousWallet });
				} catch {
					// If we end up here the wallet had previously been
					// partially restored but we again failed to fully
					// restore it which means we will just return the
					// instance again and let the consumer try again.
				}
			}

			return previousWallet;
		}

		const wallet = new Wallet(id, struct, this.#profile);

		wallet.data().fill(data);

		wallet.settings().fill(settings);

		try {
			await this.syncWalletWithNetwork({ address, coin, network, networkConfig, wallet });
		} catch {
			await wallet.setAddress(address, { syncIdentity: false, validate: false });

			wallet.markAsPartiallyRestored();
		}

		return this.storeWallet(wallet, { force: wallet.hasBeenPartiallyRestored() });
	}

	public findById(id: string): ReadWriteWallet {
		const wallet: ReadWriteWallet | undefined = this.#data.get(id);

		if (!wallet) {
			throw new Error(`Failed to find a wallet for [${id}].`);
		}

		return wallet;
	}

	public findByAddress(address: string): ReadWriteWallet | undefined {
		return this.values().find((wallet: ReadWriteWallet) => wallet.address() === address);
	}

	public findByPublicKey(publicKey: string): ReadWriteWallet | undefined {
		return this.values().find((wallet: ReadWriteWallet) => wallet.publicKey() === publicKey);
	}

	public findByCoin(coin: string): ReadWriteWallet[] {
		return this.values().filter((wallet: ReadWriteWallet) => wallet.coin().manifest().get<string>("name") === coin);
	}

	public findByCoinWithNetwork(coin: string, network: string): ReadWriteWallet[] {
		return this.values().filter(
			(wallet: ReadWriteWallet) => wallet.coinId() === coin && wallet.networkId() === network,
		);
	}

	public findByAlias(alias: string): ReadWriteWallet | undefined {
		return this.values().find(
			(wallet: ReadWriteWallet) => (wallet.alias() || "").toLowerCase() === alias.toLowerCase(),
		);
	}

	public update(id: string, data: { alias?: string }): void {
		const result = this.findById(id);

		if (data.alias) {
			const wallets: ReadWriteWallet[] = this.values();

			for (const wallet of wallets) {
				if (wallet.id() === id || !wallet.alias()) {
					continue;
				}

				if (wallet.alias()!.toLowerCase() === data.alias.toLowerCase()) {
					throw new Error(`The wallet with alias [${data.alias}] already exists.`);
				}
			}

			result.setAlias(data.alias);
		}

		this.#data.set(id, result);
	}

	public has(id: string): boolean {
		return this.#data.has(id);
	}

	public forget(id: string): void {
		this.#data.forget(id);
	}

	public flush(): void {
		this.#data.flush();
	}

	public count(): number {
		return this.keys().length;
	}

	public toObject(
		options: WalletExportOptions = {
			excludeWalletsWithoutName: false,
			excludeEmptyWallets: false,
			excludeLedgerWallets: false,
			addNetworkInformation: true,
		},
	): Record<string, object> {
		if (!options.addNetworkInformation) {
			throw Error("This is not implemented yet");
		}
		const result: Record<string, object> = {};

		for (const [id, wallet] of Object.entries(this.#data.all())) {
			if (options.excludeLedgerWallets && wallet.isLedger()) {
				continue;
			}
			if (options.excludeWalletsWithoutName && wallet.displayName() === undefined) {
				continue;
			}
			if (options.excludeEmptyWallets && wallet.balance().isZero()) {
				continue;
			}
			result[id] = wallet.toObject();
		}

		return result;
	}

	public sortBy(column: string, direction: "asc" | "desc" = "asc"): ReadWriteWallet[] {
		// TODO: sort by balance as fiat (BigInt)

		const sortFunction = (wallet: ReadWriteWallet) => {
			if (column === "coin") {
				return wallet.currency();
			}

			if (column === "type") {
				return wallet.isStarred();
			}

			if (column === "balance") {
				return wallet.balance().toFixed();
			}

			return wallet[column]();
		};

		if (direction === "asc") {
			return sortBy(this.values(), sortFunction);
		}

		return sortByDesc(this.values(), sortFunction);
	}

	private storeWallet(wallet: ReadWriteWallet, options: { force: boolean } = { force: false }): ReadWriteWallet {
		if (!options.force) {
			if (this.findByAddress(wallet.address())) {
				throw new Error(`The wallet [${wallet.address()}] already exists.`);
			}
		}

		this.#data.set(wallet.id(), wallet);

		return wallet;
	}

	private async syncWalletWithNetwork({
		address,
		coin,
		network,
		networkConfig,
		wallet,
	}: {
		wallet: ReadWriteWallet;
		coin: string;
		network: string;
		address: string;
		networkConfig: any;
	}): Promise<void> {
		await retry(
			async () => {
				await wallet.setCoin(coin, network);

				await wallet.setAddress(address);

				if (networkConfig) {
					for (const [key, value] of Object.entries(networkConfig)) {
						wallet.coin().config().set(`network.${key}`, value);
					}
				}

				wallet.markAsFullyRestored();
			},
			{
				onFailedAttempt: (error) =>
					console.log(
						`Attempt #${error.attemptNumber} to restore [${address}] failed. There are ${error.retriesLeft} retries left.`,
					),
				retries: 3,
			},
		);
	}
}
