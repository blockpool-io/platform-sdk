import { Contracts } from "@arkecosystem/platform-sdk";

/**
 * @TODO
 *
 * We need to validate that the sender of each transaction matches
 * the wallet address and/or public key we are trying to send from.
 *
 * This is quite tricky because every coin has a different method
 * to sign transactions and compute the identifying property because
 * some use an address, others a public key and again others a WIF.
 */
export class TransactionService {
	readonly #wallet;
	readonly #signed: Record<string, Contracts.SignedTransaction> = {};
	readonly #broadcasted: Record<string, Contracts.SignedTransaction> = {};

	public constructor(wallet) {
		this.#wallet = wallet;
	}

	public async signTransfer(input: Contracts.TransferInput, options?: Contracts.TransactionOptions): Promise<string> {
		return this.signTransaction("transfer", input, options);
	}

	public async signSecondSignature(
		input: Contracts.SecondSignatureInput,
		options?: Contracts.TransactionOptions,
	): Promise<string> {
		return this.signTransaction("secondSignature", input, options);
	}

	public async signDelegateRegistration(
		input: Contracts.DelegateRegistrationInput,
		options?: Contracts.TransactionOptions,
	): Promise<string> {
		return this.signTransaction("delegateRegistration", input, options);
	}

	public async signVote(input: Contracts.VoteInput, options?: Contracts.TransactionOptions): Promise<string> {
		return this.signTransaction("vote", input, options);
	}

	public async signMultiSignature(
		input: Contracts.MultiSignatureInput,
		options?: Contracts.TransactionOptions,
	): Promise<string> {
		return this.signTransaction("multiSignature", input, options);
	}

	public async signIpfs(input: Contracts.IpfsInput, options?: Contracts.TransactionOptions): Promise<string> {
		return this.signTransaction("ipfs", input, options);
	}

	public async signMultiPayment(
		input: Contracts.MultiPaymentInput,
		options?: Contracts.TransactionOptions,
	): Promise<string> {
		return this.signTransaction("multiPayment", input, options);
	}

	public async signDelegateResignation(
		input: Contracts.DelegateResignationInput,
		options?: Contracts.TransactionOptions,
	): Promise<string> {
		return this.signTransaction("delegateResignation", input, options);
	}

	public async signHtlcLock(input: Contracts.HtlcLockInput, options?: Contracts.TransactionOptions): Promise<string> {
		return this.signTransaction("htlcLock", input, options);
	}

	public async signHtlcClaim(
		input: Contracts.HtlcClaimInput,
		options?: Contracts.TransactionOptions,
	): Promise<string> {
		return this.signTransaction("htlcClaim", input, options);
	}

	public async signHtlcRefund(
		input: Contracts.HtlcRefundInput,
		options?: Contracts.TransactionOptions,
	): Promise<string> {
		return this.signTransaction("htlcRefund", input, options);
	}

	public async signBusinessRegistration(
		input: Contracts.BusinessRegistrationInput,
		options?: Contracts.TransactionOptions,
	): Promise<string> {
		return this.signTransaction("businessRegistration", input, options);
	}

	public async signBusinessResignation(
		input: Contracts.BusinessResignationInput,
		options?: Contracts.TransactionOptions,
	): Promise<string> {
		return this.signTransaction("businessResignation", input, options);
	}

	public async signBusinessUpdate(
		input: Contracts.BusinessUpdateInput,
		options?: Contracts.TransactionOptions,
	): Promise<string> {
		return this.signTransaction("businessUpdate", input, options);
	}

	public async signBridgechainRegistration(
		input: Contracts.BridgechainRegistrationInput,
		options?: Contracts.TransactionOptions,
	): Promise<string> {
		return this.signTransaction("bridgechainRegistration", input, options);
	}

	public async signBridgechainResignation(
		input: Contracts.BridgechainResignationInput,
		options?: Contracts.TransactionOptions,
	): Promise<string> {
		return this.signTransaction("bridgechainResignation", input, options);
	}

	public async signBridgechainUpdate(
		input: Contracts.BridgechainUpdateInput,
		options?: Contracts.TransactionOptions,
	): Promise<string> {
		return this.signTransaction("bridgechainUpdate", input, options);
	}

	public async broadcast(ids: string[]): Promise<Contracts.BroadcastResponse> {
		const broadcasting: Contracts.SignedTransaction = ids.map((id: string) => this.#signed[id]);

		const response: Contracts.BroadcastResponse = await this.#wallet.client().broadcast(broadcasting);

		for (const transactionId of response.accepted) {
			this.#broadcasted[transactionId] = this.#signed[transactionId];
		}

		return response;
	}

	public isAwaitingConfirmation(id: string): boolean {
		return !!this.#broadcasted[id];
	}

	public async confirm(id: string): Promise<boolean> {
		if (!this.isAwaitingConfirmation(id)) {
			throw new Error(`Transaction [${id}] is not awaiting confirmation.`);
		}

		try {
			const transaction: Contracts.TransactionData = await this.#wallet.client().transaction(id);

			if (transaction.isConfirmed()) {
				delete this.#signed[id];
				delete this.#broadcasted[id];
			}

			return transaction.isConfirmed();
		} catch {
			return false;
		}
	}

	private async signTransaction(type: string, input: any, options?: Contracts.TransactionOptions): Promise<string> {
		const transaction: Contracts.SignedTransaction = await this.getService()[type](input, options);

		this.#signed[transaction.id] = transaction;

		return transaction.id;
	}

	private getService(): Contracts.TransactionService {
		return this.#wallet.coin().transaction();
	}
}
