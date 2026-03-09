import axios from 'axios'
import Asset from '../../models/stock/assets.js'
import Transactions from '../../models/stock/transactions.js'

export const fetch = async (req, res) => {
	try {
		// Fetch assets from the database
		const assets = await Asset.find().lean()
		if (assets.length === 0) {
			return res.status(404).json({
				success: true,
				code: 404,
				message: 'Assets not found',
			})
		}

		// Fetch transactions from the database
		const transactions = await Transactions.find().lean()

		// Group transactions by ticker
		const transactionsByTicker = transactions.reduce((acc, transaction) => {
			if (!acc[transaction.ticker]) {
				acc[transaction.ticker] = []
			}
			acc[transaction.ticker].push(transaction)
			return acc
		}, {})

		// Fetch data from the API (parallel requests per ticker, with fallback if API fails)
		let apiDataMap = {}
		try {
			const results = await Promise.all(
				assets.map(async (asset) => {
					const url = `${process.env.API_URL_STOCK}/profile?symbol=${asset.ticker.toUpperCase()}&apikey=${process.env.API_KEY_STOCK}`
					const response = await axios.get(url, {
						headers: {
							'content-type': 'application/json',
							'apikey': process.env.API_KEY_STOCK,
						},
					})
					return response.data?.[0] || null
				})
			)
			results.forEach((item) => {
				if (item?.symbol) apiDataMap[item.symbol] = item
			})
		} catch (apiError) {
			console.warn('⚠️ Stock API Error:', apiError.message)
		}

		// Merge and transform the data
		const mergedData = assets.map((asset) => {
			const { symbol, image, ...restApiData } =
				apiDataMap[asset.ticker] || {}

			// Get transactions for the current asset
			const assetTransactions = transactionsByTicker[asset.ticker] || []

			const totalInvested = assetTransactions.reduce((total, transaction) => {
				if (
					(asset.active && transaction.type === 'buy') ||
					transaction.type === 'transfer'
				) {
					return total + transaction.total
				} else if (asset.active && transaction.type === 'sell') {
					return total - transaction.total
				}
				return total
			}, asset.total_invested || 0)

			const holdings = assetTransactions.reduce((holdings, transaction) => {
				if (transaction.type === 'buy' || transaction.type === 'transfer') {
					return holdings + transaction.quantity
				} else if (transaction.type === 'sell') {
					return holdings - transaction.quantity
				}
				return holdings
			}, 0)

			const dateLastInvested = assetTransactions
				.filter(
					(transaction) =>
						transaction.type === 'buy' || transaction.type === 'transfer',
				)
				.reduce(
					(lastInvested, transaction) =>
						Math.max(lastInvested, transaction.datetime),
					0,
				)

			return {
				...asset,
				...restApiData,
				ticker: symbol || asset.ticker,
				logo_url: `https://freedom24.com/logos/get-logo-by-ticker?ticker=${(symbol || asset.ticker).toLowerCase()}.us`,
				transactions: assetTransactions,
				total_invested: totalInvested,
				holdings: holdings,
				date_last_invested: dateLastInvested,
			}
		})

		res.status(200).json({
			success: true,
			code: 200,
			data: mergedData,
		})
	} catch (error) {
		console.error('FETCH ASSETS ERROR:', error.message, error.stack)
		res.status(500).json({
			error: {
				success: false,
				code: 500,
				message: 'Internal server error',
			},
		})
	}
}

export const fetchByTicker = async (req, res) => {
	try {
		const { ticker } = req.params

		const url = `${
			process.env.API_URL_STOCK
		}/profile?symbol=${ticker.toUpperCase()}&apikey=${process.env.API_KEY_STOCK}`

		const response = await axios.get(url, {
			headers: {
				'content-type': 'application/json',
				'apikey': process.env.API_KEY_STOCK,
			},
		})

		const { symbol, image, ...restApiData } = response.data[0] || {}

		res.status(200).json({
			success: true,
			code: 200,
			data: {
				ticker: symbol,
				logo_url: `https://freedom24.com/logos/get-logo-by-ticker?ticker=${symbol.toLowerCase()}.us`,
				...restApiData,
			},
		})
	} catch (error) {
		console.error('FETCH BY TICKER ERROR:', error.message)
		res.status(500).json({
			error: {
				success: false,
				code: 500,
				message: 'Internal server error',
			},
		})
	}
}

// logic for creating new asset from database
export const create = async (req, res) => {
	try {
		const assetData = new Asset(req.body)
		const { ticker } = assetData
		const tickerExist = await Asset.findOne({ ticker })

		if (tickerExist) {
			return res
				.status(400)
				.json({ success: true, code: 404, message: 'Asset already exists' })
		}

		const savedAsset = await assetData.save()

		// Fetch transactions from the database
		const transactions = await Transactions.find({ ticker }).lean()

		const totalInvested = transactions.reduce((total, transaction) => {
			if (assetData.active && transaction.type === 'buy') {
				return total + transaction.total
			} else if (assetData.active && transaction.type === 'sell') {
				return total - transaction.total
			}
			return total
		}, assetData.total_invested || 0)

		const holdings = transactions.reduce((holdings, transaction) => {
			if (transaction.type === 'buy') {
				return holdings + transaction.quantity
			} else if (transaction.type === 'sell') {
				return holdings - transaction.quantity
			}
			return holdings
		}, 0)

		const dateLastInvested = transactions
			.filter((transaction) => transaction.type === 'buy')
			.reduce(
				(lastInvested, transaction) =>
					Math.max(lastInvested, transaction.datetime),
				0,
			)

		let apiData = {}
		try {
			const url = `${
				process.env.API_URL_STOCK
			}/profile?symbol=${ticker.toUpperCase()}&apikey=${process.env.API_KEY_STOCK}`

			const response = await axios.get(url, {
				headers: {
					'content-type': 'application/json',
					'apikey': process.env.API_KEY_STOCK,
				},
			})
			apiData = response.data[0] || {}
		} catch (apiError) {
			console.warn('⚠️ Stock API Error on create:', apiError.message)
		}

		const { symbol, image, ...restApiData } = apiData

		res.status(200).json({
			success: true,
			code: 200,
			data: {
				...savedAsset.toObject(),
				...restApiData,
				ticker: symbol || ticker,
				logo_url: `https://freedom24.com/logos/get-logo-by-ticker?ticker=${(symbol || ticker).toLowerCase()}.us`,
				transactions: transactions,
				total_invested: totalInvested,
				holdings: holdings,
				date_last_invested: dateLastInvested,
			},
			message: 'Asset Successfully Added',
		})
	} catch (error) {
		console.error('CREATE ASSET ERROR:', error.message)
		res.status(500).json({ error: 'Internal server error' })
	}
}

// logic for update a asset
export const update = async (req, res) => {
	try {
		const id = req.params.id
		const assetExist = await Asset.findOne({ _id: id })
		if (!assetExist) {
			return res
				.status(404)
				.json({ success: true, code: 404, message: 'Asset not found' })
		}
		const updatedAsset = await Asset.findByIdAndUpdate(id, req.body, {
			new: true,
		})

		let apiData = {}
		try {
			// Fetch data from the API for the new asset
			const url = `${
				process.env.API_URL_STOCK
			}/profile?symbol=${updatedAsset.ticker.toUpperCase()}&apikey=${
				process.env.API_KEY_STOCK
			}`

			const response = await axios.get(url, {
				headers: {
					'content-type': 'application/json',
					'apikey': process.env.API_KEY_STOCK,
				},
			})
			apiData = response.data[0] || {}
		} catch (apiError) {
			console.warn('⚠️ Stock API Error on update:', apiError.message)
		}

		const { symbol, image, ...restApiData } = apiData

		res.status(200).json({
			success: true,
			code: 200,
			data: {
				...updatedAsset.toObject(),
				...restApiData,
				ticker: symbol || updatedAsset.ticker,
				logo_url: `https://freedom24.com/logos/get-logo-by-ticker?ticker=${(symbol || updatedAsset.ticker).toLowerCase()}.us`,
			},
			message: 'Asset Successfully Updated',
		})
	} catch (error) {
		console.error('UPDATE ASSET ERROR:', error.message)
		res.status(500).json({
			error: {
				success: false,
				code: 500,
				message: 'Internal server error',
			},
		})
	}
}

// logic for delete an asset from database
export const deleteAsset = async (req, res) => {
	try {
		const id = req.params.id
		const assetExist = await Asset.findOne({ _id: id })
		if (!assetExist) {
			return res
				.status(404)
				.json({ success: true, code: 404, message: 'Asset not found' })
		}
		const transactionsToDelete = await Transactions.find({
			ticker: assetExist.ticker,
		})

		await Transactions.deleteMany({ ticker: assetExist.ticker })

		await Asset.findByIdAndDelete(id)

		res.status(200).json({
			success: true,
			code: 200,
			message: 'Asset Successfully Deleted',
			deletedTransactions: transactionsToDelete,
		})
	} catch (error) {
		console.error('DELETE ASSET ERROR:', error.message)
		res.status(500).json({
			error: {
				success: false,
				code: 500,
				message: 'Internal server error',
			},
		})
	}
}
