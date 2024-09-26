const express = require('express');
const path = require('path');
const { getBalance, config } = require('./balance.js');
require('dotenv').config();

const app = express();
app.use(express.static(path.join(__dirname)));
app.use(express.json());

let currentAddress = process.env.ADDRESS;  // Default address if none provided

// Endpoint to handle address input from frontend
app.post('/track-balance', (req, res) => {
    const { address } = req.body;
    if (!address) {
        return res.status(400).json({ success: false, message: 'Address required' });
    }
    currentAddress = address;
    res.json({ success: true });
});

// Endpoint to get the balance
app.get('/get-balance', async (req, res) => {
    try {
        // Update the address in the config dynamically
        config.data = JSON.stringify({
            "query": `{\n  EVM(dataset: combined, network: eth) {\n    BalanceUpdates(\n      where: {BalanceUpdate: {Address: {is: \"${currentAddress}\"}}, Currency: {SmartContract: {is: \"0x\"}}}\n    ) {\n      sum(of: BalanceUpdate_Amount)\n    }\n  }\n}\n`,
            "variables": "{}"
        });

        const balance = await getBalance(config);
        res.json({ balance: balance || '0' });
    } catch (error) {
        console.error('Error fetching balance:', error);
        res.status(500).json({ error: 'Error fetching balance' });
    }
});

// Start WebSocket connection for real-time updates
const { WebSocket } = require("ws");

const bitqueryConnection = new WebSocket(
  "wss://streaming.bitquery.io/graphql?token=" + process.env.AUTH_TOKEN,
  ["graphql-ws"],
);

bitqueryConnection.on("open", () => {
  console.log("Connected to Bitquery.");

  const initMessage = JSON.stringify({ type: "connection_init" });
  bitqueryConnection.send(initMessage);
});

bitqueryConnection.on("message", async (data) => {
  const response = JSON.parse(data);
  
  if (response.type === "connection_ack") {
    const subscriptionMessage = JSON.stringify({
      type: "start",
      id: "1",
      payload: {
        query: `
        subscription {
            EVM{
                BalanceUpdates(
                    where: {
                        BalanceUpdate: {
                            Address: {
                                is: "${currentAddress}"
                            }
                        }, 
                        Currency: {SmartContract: {is: "0x"}}
                    }
                ) {
                    BalanceUpdate {
                        Amount
                    }
                }
            }
        }`,
      },
    });

    bitqueryConnection.send(subscriptionMessage);
    console.log("Subscription message sent.");
  }
});

bitqueryConnection.on("error", (error) => {
  console.error("WebSocket Error:", error);
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
