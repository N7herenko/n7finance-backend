import axios from "axios";
import Asset from "../../models/crypto/assets.js";
import Transactions from "../../models/crypto/transactions.js";

export const fetch = async (req, res) => {
  try {
    // Fetch assets from the database
    const assets = await Asset.find().lean();
    if (assets.length === 0) {
      return res.status(404).json({
        success: true,
        code: 404,
        message: "Assets not found",
      });
    }

    // Fetch transactions from the database
    const transactions = await Transactions.find().lean();

    // Group transactions by ticker
    const transactionsByTicker = transactions.reduce((acc, transaction) => {
      if (!acc[transaction.ticker]) {
        acc[transaction.ticker] = [];
      }
      acc[transaction.ticker].push(transaction);
      return acc;
    }, {});

    // Fetch data from the API
    const requestData = {
      codes: assets.map((asset) => asset.ticker),
      currency: "USD",
      sort: "rank",
      order: "ascending",
      offset: 0,
      limit: 0,
      meta: true,
    };

    const url = `${process.env.API_URL_CRYPTO}/coins/map`;

    const response = await axios.post(url, requestData, {
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.API_KEY_CRYPTO,
      },
    });

    // Create a map for the API data based on the 'symbol' field
    const apiDataMap = new Map(response.data.map((item) => [item.code, item]));

    // Merge and transform the data
    const mergedData = assets.map((asset) => {
      const { code, png64, png32, webp32, webp64, color, ...restApiData } =
        apiDataMap.get(asset.ticker) || {};

      // Get transactions for the current asset
      const assetTransactions = transactionsByTicker[asset.ticker] || [];

      const totalInvested = assetTransactions.reduce((total, transaction) => {
        if (
          (asset.active && transaction.type === "buy") ||
          transaction.type === "transfer"
        ) {
          return total + transaction.total;
        } else if (asset.active && transaction.type === "sell") {
          return total - transaction.total;
        }
        return total;
      }, asset.total_invested || 0);

      const holdings = assetTransactions.reduce((holdings, transaction) => {
        if (transaction.type === "buy" || transaction.type === "transfer") {
          return holdings + transaction.quantity;
        } else if (transaction.type === "sell") {
          return holdings - transaction.quantity;
        }
        return holdings;
      }, 0);

      const dateLastInvested = assetTransactions
        .filter(
          (transaction) =>
            transaction.type === "buy" || transaction.type === "transfer"
        )
        .reduce(
          (lastInvested, transaction) =>
            Math.max(lastInvested, transaction.datetime),
          0
        );

      return {
        ...asset,
        ...restApiData,
        logo_url: png64,
        transactions: assetTransactions,
        total_invested: totalInvested,
        holdings: holdings,
        date_last_invested: dateLastInvested,
      };
    });

    res.status(200).json({
      success: true,
      code: 200,
      data: mergedData,
    });
  } catch (error) {
    res.status(500).json({
      error: {
        success: false,
        code: 500,
        message: "Internal server error",
      },
    });
  }
};

export const fetchByTicker = async (req, res) => {
  try {
    const { ticker } = req.params;

    const requestData = {
      codes: [`_${ticker.toUpperCase()}`, ticker.toUpperCase()],
      currency: "USD",
      sort: "rank",
      order: "ascending",
      offset: 0,
      limit: 0,
      meta: true,
    };

    const url = `${process.env.API_URL_CRYPTO}/coins/map`;

    const response = await axios.post(url, requestData, {
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.API_KEY_CRYPTO,
      },
    });
    const transformedData = response.data.map((asset) => ({
      ticker: asset.code,
      name: asset.name,
      rank: asset.rank,
      age: asset.age,
      logo_url: asset.png64,
      exchanges: asset.exchanges,
      markets: asset.markets,
      pairs: asset.pairs,
      categories: asset.categories,
      allTimeHighUSD: asset.allTimeHighUSD,
      circulatingSupply: asset.circulatingSupply,
      totalSupply: asset.totalSupply,
      maxSupply: asset.maxSupply,
      links: {
        website: asset.links.website,
        whitepaper: asset.links.whitepaper,
        twitter: asset.links.twitter,
        reddit: asset.links.reddit,
        telegram: asset.links.telegram,
        discord: asset.links.discord,
        medium: asset.links.medium,
        instagram: asset.links.instagram,
        tiktok: asset.links.tiktok,
        youtube: asset.links.youtube,
        linkedin: asset.links.linkedin,
        twitch: asset.links.twitch,
        spotify: asset.links.spotify,
        naver: asset.links.naver,
        wechat: asset.links.wechat,
        soundcloud: asset.links.soundcloud,
      },
      rate: asset.rate,
      volume: asset.volume,
      cap: asset.cap,
      liquidity: asset.liquidity, // Assuming liquidity is available in your data
      delta: asset.delta,
    }));

    res.status(200).json({
      success: true,
      code: 200,
      data: transformedData,
    });
  } catch (error) {
    res.status(500).json({
      error: {
        success: false,
        code: 500,
        message: "Internal server error",
      },
    });
  }
};

// logic for creating new asset from database
export const create = async (req, res) => {
  try {
    const assetData = new Asset(req.body);
    const { ticker } = assetData;
    const tickerExist = await Asset.findOne({ ticker });

    if (tickerExist) {
      return res
        .status(400)
        .json({ success: true, code: 404, message: "Asset already exists" });
    }

    const savedAsset = await assetData.save();

    // Fetch transactions from the database
    const transactions = await Transactions.find({ ticker }).lean();

    const totalInvested = transactions.reduce((total, transaction) => {
      if (assetData.active && transaction.type === "buy") {
        return total + transaction.total;
      } else if (assetData.active && transaction.type === "sell") {
        return total - transaction.total;
      }
      return total;
    }, assetData.total_invested || 0);

    const holdings = transactions.reduce((holdings, transaction) => {
      if (transaction.type === "buy") {
        return holdings + transaction.quantity;
      } else if (transaction.type === "sell") {
        return holdings - transaction.quantity;
      }
      return holdings;
    }, 0);

    const dateLastInvested = transactions
      .filter((transaction) => transaction.type === "buy")
      .reduce(
        (lastInvested, transaction) =>
          Math.max(lastInvested, transaction.datetime),
        0
      );

    // Fetch data from the API for the new asset
    const requestData = {
      codes: [ticker],
      currency: "USD",
      sort: "rank",
      order: "ascending",
      offset: 0,
      limit: 0,
      meta: true,
    };

    const url = `${process.env.API_URL_CRYPTO}/coins/map`;

    const response = await axios.post(url, requestData, {
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.API_KEY_CRYPTO,
      },
    });

    const apiData = response.data[0];
    const { png64, png32, webp32, webp64, color, ...restApiData } =
      apiData || {};

    res.status(200).json({
      success: true,
      code: 200,
      data: {
        ...savedAsset.toObject(),
        ...restApiData,
        logo_url: png64,
        transactions: transactions,
        total_invested: totalInvested,
        holdings: holdings,
        date_last_invested: dateLastInvested,
      },
      message: "Asset Successfully Added",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// logic for update a asset
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    const assetExist = await Asset.findOne({ _id: id });
    if (!assetExist) {
      return res
        .status(404)
        .json({ success: true, code: 404, message: "Asset not found" });
    }
    const updatedAsset = await Asset.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    // Fetch data from the API for the new asset
    const requestData = {
      currency: "USD",
      code: updatedAsset.ticker,
      meta: true,
    };

    const url = `${process.env.API_URL_CRYPTO}/coins/single`;

    const response = await axios.post(url, requestData, {
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.API_KEY_CRYPTO,
      },
    });

    const apiData = response.data;
    const { png64, png32, webp32, webp64, color, ...restApiData } =
      apiData || {};

    res.status(200).json({
      success: true,
      code: 200,
      data: {
        ...updatedAsset.toObject(),
        ...restApiData,
        logo_url: png64,
      },
      message: "Asset Successfully Updated",
    });
  } catch (error) {
    res.status(500).json({
      error: {
        success: false,
        code: 500,
        message: "Internal server error",
      },
    });
  }
};

// logic for delete an asset from database
export const deleteAsset = async (req, res) => {
  try {
    const id = req.params.id;
    const assetExist = await Asset.findOne({ _id: id });
    if (!assetExist) {
      return res
        .status(404)
        .json({ success: true, code: 404, message: "Asset not found" });
    }
    const transactionsToDelete = await Transactions.find({
      ticker: assetExist.ticker,
    });

    await Transactions.deleteMany({ ticker: assetExist.ticker });

    await Asset.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      code: 200,
      message: "Asset Successfully Deleted",
      deletedTransactions: transactionsToDelete,
    });
  } catch (error) {
    res.status(500).json({
      error: {
        success: false,
        code: 500,
        message: "Internal server error",
      },
    });
  }
};
