const axios = require('axios');

require('dotenv').config()

let data = JSON.stringify({
    "query": "{\n  EVM(dataset: combined, network: eth) {\n    BalanceUpdates(\n      where: {BalanceUpdate: {Address: {is: \"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2\"}}, Currency: {SmartContract: {is: \"0x\"}}}\n    ) {\n      sum(of: BalanceUpdate_AmountInUSD)\n    }\n  }\n}\n",
    "variables": "{}"
 });

let config = {
   method: 'post',
   maxBodyLength: Infinity,
   url: 'https://streaming.bitquery.io/graphql',
   headers: { 
      'Content-Type': 'application/json', 
      'X-API-KEY': 'BQYuTITWanwYGz0YLGdcWSADO74o5RTX', 
      'Authorization': `Bearer ${process.env.AUTH_TOKEN}`
   },
   data : data
};

const getBalance = async (config) => {
    try {
        const response = await axios.request(config);
        // console.log(response.data.data.EVM.BalanceUpdates[0].sum)
        return response.data.data.EVM.BalanceUpdates[0].sum;        
    } catch (error) {
        return error;
    }

}

// getBalance(config)

module.exports = {getBalance, config};