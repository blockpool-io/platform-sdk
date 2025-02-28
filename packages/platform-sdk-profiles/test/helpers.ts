import "jest-extended";

import { ADA } from "@arkecosystem/platform-sdk-ada";
import { ARK } from "@arkecosystem/platform-sdk-ark";
import { BTC } from "@arkecosystem/platform-sdk-btc";
import { ETH } from "@arkecosystem/platform-sdk-eth";
import { Request } from "@arkecosystem/platform-sdk-http-got";
import nock from "nock";

import { CoinService } from "../src/environment/services/coin-service";
import { Contact } from "../src/contacts/contact";
import { ContactStruct } from "../src/contacts/contact.models";
import { container } from "../src/environment/container";
import { DataRepository } from "../src/repositories/data-repository";
import { DelegateService } from "../src/environment/services/delegate-service";
import { ExchangeRateService } from "../src/environment/services/exchange-rate-service";
import { FeeService } from "../src/environment/services/fee-service";
import { Identifiers } from "../src/environment/container.models";
import { KnownWalletService } from "../src/environment/services/known-wallet-service";
import { Profile } from "../src/profiles/profile";
import { ProfileRepository } from "../src/repositories/profile-repository";
import { StubStorage } from "./stubs/storage";
import { Wallet } from "../src/wallets/wallet";
import { WalletService } from "../src/environment/services/wallet-service";

export const bootContainer = (): void => {
	container.bind(Identifiers.Storage, new StubStorage());
	container.bind(Identifiers.AppData, new DataRepository());
	container.bind(Identifiers.Coins, { ADA, ARK, BTC, ETH });
	container.bind(Identifiers.CoinService, new CoinService());
	container.bind(Identifiers.DelegateService, new DelegateService());
	container.bind(Identifiers.ExchangeRateService, new ExchangeRateService());
	container.bind(Identifiers.FeeService, new FeeService());
	container.bind(Identifiers.HttpClient, new Request());
	container.bind(Identifiers.KnownWalletService, new KnownWalletService());
	container.bind(Identifiers.ProfileRepository, new ProfileRepository());
	container.bind(Identifiers.WalletService, new WalletService());
};

export const knock = (): void => {
	nock.disableNetConnect();

	nock(/.+/)
		.get("/api/node/configuration")
		.reply(200, require("./fixtures/client/configuration.json"))
		.get("/api/node/configuration/crypto")
		.reply(200, require("./fixtures/client/cryptoConfiguration.json"))
		.get("/api/node/syncing")
		.reply(200, require("./fixtures/client/syncing.json"))
		.get("/api/peers")
		.reply(200, require("./fixtures/client/peers.json"))
		.get("/api/node/fees")
		.query(true)
		.reply(200, require("./fixtures/client/node-fees.json"))
		.get("/api/transactions/fees")
		.query(true)
		.reply(200, require("./fixtures/client/transaction-fees.json"))
		.get("/api/delegates")
		.query(true)
		.reply(200, require("./fixtures/client/delegates-2.json"));
};

export const makeProfile = (data: object = {}): Profile =>
	new Profile({ id: "uuid", name: "name", avatar: "avatar", data: "", ...data });
export const makeContact = (data: ContactStruct, profile: Profile): Contact => new Contact(data, profile);
export const makeWallet = (id: string, profile: Profile): Wallet => new Wallet(id, {}, profile);
