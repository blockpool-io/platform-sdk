import { Coins, Contracts } from "@arkecosystem/platform-sdk";

export class LinkService implements Contracts.LinkService {
	readonly #baseUrl: string;

	private constructor(network: Coins.CoinNetwork) {
		this.#baseUrl = network.explorer;
	}

	public static async __construct(config: Coins.Config): Promise<LinkService> {
		return new LinkService(config.get<Coins.CoinNetwork>("network"));
	}

	public async __destruct(): Promise<void> {
		//
	}

	public block(id: string): string {
		return `${this.#baseUrl}/miniblocks/${id}`;
	}

	public transaction(id: string): string {
		return `${this.#baseUrl}/transactions/${id}`;
	}

	public wallet(id: string): string {
		return `${this.#baseUrl}/accounts/${id}`;
	}
}
