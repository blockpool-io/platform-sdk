import { Contracts } from "@arkecosystem/platform-sdk";
import { DateTime } from "@arkecosystem/platform-sdk-intl";

import { HistoricalPriceTransformer } from "./transformers/historical-price-transformer";
import { HistoricalVolumeTransformer } from "./transformers/historical-volume-transformer";
import { MarketTransformer } from "./transformers/market-transformer";

/**
 *
 *
 * @export
 * @class PriceTracker
 * @implements {Contracts.PriceTracker}
 */
export class PriceTracker implements Contracts.PriceTracker {
	/**
	 *
	 *
	 * @private
	 * @type {Contracts.KeyValuePair}
	 * @memberof PriceTracker
	 */
	private readonly tokenLookup: Contracts.KeyValuePair = {};

	/**
	 *
	 *
	 * @type {Contracts.HttpClient}
	 * @memberof PriceTracker
	 */
	readonly #httpClient: Contracts.HttpClient;

	/**
	 *
	 *
	 * @type {string}
	 * @memberof PriceTracker
	 */
	readonly #host: string = "https://api.coingecko.com/api/v3";

	/**
	 *Creates an instance of PriceTracker.
	 * @param {Contracts.HttpClient} httpClient
	 * @memberof PriceTracker
	 */
	public constructor(httpClient: Contracts.HttpClient) {
		this.#httpClient = httpClient;
	}

	/** {@inheritDoc Contracts.PriceTracker.verifyToken} */
	public async verifyToken(token: string): Promise<boolean> {
		const tokenId = await this.getTokenId(token);

		try {
			const body = await this.get(`simple/price`, {
				ids: tokenId,
				vs_currencies: "BTC",
			});

			return !!body[tokenId];
		} catch {
			return false;
		}
	}

	/** {@inheritDoc Contracts.PriceTracker.marketData} */
	public async marketData(token: string): Promise<Contracts.MarketDataCollection> {
		const tokenId = await this.getTokenId(token);

		const body = await this.get(`coins/${tokenId}`);

		return new MarketTransformer(body.market_data).transform({});
	}

	/** {@inheritDoc Contracts.PriceTracker.historicalPrice} */
	public async historicalPrice(options: Contracts.HistoricalPriceOptions): Promise<Contracts.HistoricalData> {
		const tokenId = await this.getTokenId(options.token);

		const body = await this.get(`coins/${tokenId}/market_chart`, {
			vs_currency: options.currency,
			days: options.days,
		});

		return new HistoricalPriceTransformer(body).transform(options);
	}

	/** {@inheritDoc Contracts.PriceTracker.historicalVolume} */
	public async historicalVolume(options: Contracts.HistoricalVolumeOptions): Promise<Contracts.HistoricalData> {
		const tokenId = await this.getTokenId(options.token);

		const body = await this.get(`coins/${tokenId}/market_chart/range`, {
			id: options.token,
			vs_currency: options.currency,
			from: DateTime.make().subDays(options.days).toUNIX(),
			to: DateTime.make().toUNIX(),
		});

		return new HistoricalVolumeTransformer(body).transform(options);
	}

	/** {@inheritDoc Contracts.PriceTracker.dailyAverage} */
	public async dailyAverage(options: Contracts.DailyAverageOptions): Promise<number> {
		const tokenId = await this.getTokenId(options.token);

		const response = await this.get(`coins/${tokenId}/history`, {
			date: DateTime.make(options.timestamp).format("DD-MM-YYYY"),
		});

		return response.market_data?.current_price[options.currency.toLowerCase()];
	}

	/**
	 *
	 *
	 * @private
	 * @param {*} token
	 * @returns {Promise<string>}
	 * @memberof PriceTracker
	 */
	private async getTokenId(token): Promise<string> {
		if (Object.keys(this.tokenLookup).length > 0) {
			return this.tokenLookup[token.toUpperCase()];
		}

		const uri = `coins/list`;
		const body = await this.get(uri);

		for (const value of Object.values(body)) {
			// @ts-ignore
			this.tokenLookup[value.symbol.toUpperCase()] = value.id;
		}

		return this.tokenLookup[token.toUpperCase()];
	}

	/**
	 *
	 *
	 * @private
	 * @param {string} path
	 * @param {*} [query={}]
	 * @returns {Promise<any>}
	 * @memberof PriceTracker
	 */
	private async get(path: string, query = {}): Promise<any> {
		const response = await this.#httpClient.get(`${this.#host}/${path}`, query);

		return response.json();
	}
}
