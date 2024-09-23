const axios = require('axios');
let data = JSON.stringify({
   "query": "{\n  EVM(dataset: combined, network: eth) {\n    BalanceUpdates(\n      where: {BalanceUpdate: {Address: {is: \"0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad\"}}}\n    ) {\n      sum(of: BalanceUpdate_AmountInUSD)\n    }\n  }\n}\n",
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
        return response.data.data.EVM.BalanceUpdates[0].sum;        
    } catch (error) {
        return error;
    }

}

module.exports = {getBalance, config};