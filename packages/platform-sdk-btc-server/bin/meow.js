#!/usr/bin/env node

const meow = require("meow");

module.exports = meow(
	`
	Usage
	  $ sbtc <input>
`,
	{
		flags: {
			coin: {
				type: "string",
				default: "btc",
			},
			network: {
				type: "string",
				default: "mainnet",
			},
			host: {
				type: "string",
				default: "0.0.0.0",
			},
			port: {
				type: "number",
				default: 3000,
			},
			points: {
				type: "number",
				default: 5,
			},
			duration: {
				type: "number",
				default: 1,
			},
			whitelist: {
				type: "string",
				default: "",
			},
			blacklist: {
				type: "string",
				default: "",
			},
			database: {
				type: "string",
			},
			rpc: {
				type: "string",
				isRequired: true,
			},
			username: {
				type: "string",
				isRequired: true,
			},
			password: {
				type: "string",
				isRequired: true,
			},
		},
	},
);
