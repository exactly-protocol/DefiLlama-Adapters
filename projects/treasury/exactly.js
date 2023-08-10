const { sumTokens2 } = require("../helper/unwrapLPs");

/** @type {Record<string, { auditor: string, timelock?: string, exa?: string }>} */
const config = {
  ethereum: {
    auditor: "0x310A2694521f75C7B2b64b5937C16CE65C3EFE01",
  },
  optimism: {
    auditor: "0xaEb62e6F27BC103702E7BC879AE98bceA56f027E",
    timelock: "0x92024C4bDa9DA602b711B9AbB610d072018eb58b",
    exa: "0x1e925de1c68ef83bd98ee3e130ef14a50309c01b",
  },
};

/** @type {(api: ChainApi, markets: string[]) => Promise<string[]>} */
const getTreasuries = async (api, markets) =>
  api.multiCall({
    abi: abis.treasury,
    calls: markets,
  });

Object.entries(config).forEach(([chain, { auditor, timelock, exa }]) => {
  module.exports[chain] = {
    tvl: async (_, __, ___, { api }) => {
      const markets = await api.call({ abi: abis.allMarkets, target: auditor });
      const treasuries = await getTreasuries(api, markets);
      return sumTokens2({
        chain,
        api,
        tokens: markets,
        owners: timelock ? [...treasuries, timelock] : treasuries,
      });
    },
    ownTokens: async (_, __, ___, { api }) => {
      const treasuries = await getTreasuries(
        api,
        await api.call({ abi: abis.allMarkets, target: auditor })
      );
      return sumTokens2({
        chain,
        api,
        tokens: exa ? [exa] : [],
        owners: timelock ? [...treasuries, timelock] : treasuries,
      });
    },
  };
});

const abis = {
  allMarkets: "function allMarkets() view returns (address[])",
  treasury: "function treasury() view returns (address)",
};

/** @typedef {import("@defillama/sdk").ChainApi} ChainApi */
