const { WebSocket } = require("ws");
const {getBalance, config} = require('./balance.js')

require('dotenv').config()

const bitqueryConnection = new WebSocket(
  "wss://streaming.bitquery.io/eap?token=" + process.env.AUTH_TOKEN,
  ["graphql-ws"],
);

bitqueryConnection.on("open", () => {
  console.log("Connected to Bitquery.");

  // Send initialization message (connection_init)
  const initMessage = JSON.stringify({ type: "connection_init" });
  bitqueryConnection.send(initMessage);
});

bitqueryConnection.on("message", (data) => {
  const response = JSON.parse(data);

  const latestBalance = getBalance(config); 

  // Handle connection acknowledgment (connection_ack)
  if (response.type === "connection_ack") {
    console.log("Connection acknowledged by server.");

    // Send subscription message after receiving connection_ack
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
                                is: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
                            }
                        }
                    }
                ) {
                    BalanceUpdate {
                        AmountInUSD
                    }
                }
            }
        }`,
      },
    });

    bitqueryConnection.send(subscriptionMessage);
    console.log("Subscription message sent.");
  }

  // Handle received data
  if (response.type === "data") {
    console.log("Received data from Bitquery: ", response.payload.data);
  }

  // Handle keep-alive messages (ka)
  if (response.type === "ka") {
    console.log("Keep-alive message received.");
    // No action required; just acknowledgment that the connection is alive.
  }

  if (response.type === "error") {
    console.error("Error message received:", response.payload.errors);
  }
});

bitqueryConnection.on("close", () => {
  console.log("Disconnected from Bitquery.");
});

bitqueryConnection.on("error", (error) => {
  console.error("WebSocket Error:", error);
});
