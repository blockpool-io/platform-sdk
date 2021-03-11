import { Coins } from "@arkecosystem/platform-sdk";
import { Buffer } from "buffer";

import { postGraphql } from "./helpers";
import { addressFromAccountExtPublicKey } from "./identity/shelley";

export class Bridge {
	readonly #config: Coins.Config;

	public constructor(config: Coins.Config) {
		this.#config = config;
	}

	public async usedAddressesForAccount(accountPublicKey: string) {
		const usedSpendAddresses: Set<string> = new Set<string>();
		const usedChangeAddresses: Set<string> = new Set<string>();

		let offset = 0;
		let exhausted = false;
		do {
			const spendAddresses: string[] = await this.addressesChunk(accountPublicKey, false, offset);
			const changeAddresses: string[] = await this.addressesChunk(accountPublicKey, true, offset);

			const allAddresses = spendAddresses.concat(changeAddresses);
			const usedAddresses: string[] = await this.fetchUsedAddressesData(allAddresses);

			spendAddresses
				.filter((sa) => usedAddresses.find((ua) => ua === sa) !== undefined)
				.forEach((sa) => usedSpendAddresses.add(sa));
			changeAddresses
				.filter((sa) => usedAddresses.find((ua) => ua === sa) !== undefined)
				.forEach((sa) => usedChangeAddresses.add(sa));

			exhausted = usedAddresses.length === 0;
			offset += 20;
		} while (!exhausted);
		return { usedSpendAddresses, usedChangeAddresses };
	}

	public async addressesChunk(accountPublicKey: string, isChange: boolean, offset: number): Promise<string[]> {
		const publicKey = Buffer.from(accountPublicKey, "hex");
		const networkId = this.#config.get<string>(Coins.ConfigKey.CryptoNetworkId);

		const addresses: string[] = [];
		for (let i = offset; i < offset + 20; ++i) {
			addresses.push(addressFromAccountExtPublicKey(publicKey, isChange, i, networkId));
		}
		return addresses;
	}

	public async fetchUsedAddressesData(addresses: string[]): Promise<string[]> {
		const query = `
			{
				transactions(
					where: {
						_or: [
							{
								inputs: {
									address: {
										_in: [
											${addresses.map((a) => '"' + a + '"').join("\n")}
										]
									}
								}
							}
							{
							outputs: {
								address: {
										_in: [
											${addresses.map((a) => '"' + a + '"').join("\n")}
										]
									}
								}
							}
						]
					}
				) {
					inputs {
						address
					}
					outputs {
						address
					}
				}
			}`;
		return ((await postGraphql(this.#config, query)) as any).transactions
			.flatMap((tx) => tx.inputs.map((i) => i.address).concat(tx.outputs.map((o) => o.address)))
			.sort();
	}

	public async fetchUtxosAggregate(addresses: string[]): Promise<string> {
		const query = `
			{
				utxos_aggregate(
					where: {
						address: {
							_in: [
								${addresses.map((a) => '"' + a + '"').join("\n")}
							]
						}
					}
				) {
					aggregate {
						sum {
							value
						}
					}
				}
			}`;
		return ((await postGraphql(this.#config, query)) as any).utxos_aggregate.aggregate.sum.value;
	}

	public async fetchTransactions(addresses: string[]): Promise<object[]> {
		const query = `
			{
				transactions(
					where: {
						_or: [
							{
								inputs: {
									address: {
										_in: [
											${addresses.map((a) => '"' + a + '"').join("\n")}
										]
									}
								}
							}
							{
							outputs: {
								address: {
										_in: [
											${addresses.map((a) => '"' + a + '"').join("\n")}
										]
									}
								}
							}
						]
					}
					) {
						hash
						includedAt
						inputs {
							sourceTransaction {
       					hash
      				}
						  value
							address
						}
						outputs {
						  index
						  value
							address
						}
					}
				}
			}`;

		return ((await postGraphql(this.#config, query)) as any).transactions;
	}
}
