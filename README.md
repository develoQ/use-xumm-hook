# React Xumm Hook
[![npm version](https://badge.fury.io/js/@tequ%2Fuse-xumm-hook.svg)](https://badge.fury.io/js/@tequ%2Fuse-xumm-hook)

`use-xumm-hook` enables access to Xumm from React Hooks.

It uses [Xumm-Universal-SDK](https://github.com/XRPL-Labs/Xumm-Universal-SDK) to communicate with Xumm.

## installation

npm
```sh
npm install @tequ/use-xumm-hook
```

yarn
```sh
yarn add @tequ/use-xumm-hook
```

## usage

```tsx
import useXumm from "@tequ/use-xumm-hook";

function App() {
  const { connect, disconnect, user, signTransaction } = useXumm(
    "7fcb00b9-b846-4ddf-ae02-************"
  );

  const payment = () => {
    signTransaction({
      TransactionType: "Payment",
      Destination: "rQQQrUdN1cLdNmxH4dHfKgmX5P4kf3ZrM",
      Amount: "1000000",
    }).then((payload) => {
      if (payload.response.txid) {
        alert("txId:" + payload.response.txid);
      } else {
        alert("canceled");
      }
    });
  };

  return (
    <div>
      <div>
        <button onClick={connect}>Connect</button>
        <button onClick={disconnect}>Disconnect</button>
      </div>
      {user?.account && (
        <>
          <button onClick={payment}>Payment Transaction</button>
          <button onClick={mintNFT}>NFT Mint Transaction</button>
        </>
      )}
    </div>
  );
}

export default App;
```
