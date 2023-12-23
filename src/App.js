import "./styles.css";
import "@rainbow-me/rainbowkit/styles.css";
import React from "react";

import {
  apiProvider,
  configureChains,
  getDefaultWallets,
  RainbowKitProvider,
  ConnectButton
} from "@rainbow-me/rainbowkit";
import { chain, createClient, WagmiProvider, useAccount } from "wagmi";

import keccak256 from "keccak256";
import MerkleTree from "merkletreejs";

const DEFAULT_ADDRESSES = [
  "0x08D30c4322e2E8056A224c34761F6eA053906838",
  "0x7aD6be2a86dAa5F39ec2E0cfaE87482FF036D188",
  "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4"
];

const { chains, provider } = configureChains(
  [chain.mainnet, chain.rinkeby],
  [apiProvider.fallback()]
);

const { connectors } = getDefaultWallets({
  appName: "Merkle Gen",
  chains
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider
});

const bufferToHex = (x) => `0x${x.toString("hex")}`;

function App() {
  const { data: accountData } = useAccount();

  const [connected, setConnected] = React.useState(false);
  const [addresses, setAddresses] = React.useState(
    DEFAULT_ADDRESSES.join(", ")
  );
  const [root, setRoot] = React.useState("—");
  const [proof, setProof] = React.useState("—");

  React.useEffect(() => setConnected(Boolean(accountData?.address)), [
    accountData
  ]);

  const generate = () => {
    const cleanAddresses = addresses
      .split(",")
      .filter((address) => address !== "")
      .map((a) => a.trim());
    cleanAddresses.push(accountData?.address);

    const leaves = cleanAddresses.map((x) => keccak256(x));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

    const leaf = keccak256(accountData?.address);
    const proof = tree.getProof(leaf).map((x) => bufferToHex(x.data));
    const leaf1 = keccak256("0x5B38Da6a701c568545dCfcB03FcB875f56beddC4");
    const proof2 = tree.getProof(leaf1).map((x) => bufferToHex(x.data));

    setRoot(bufferToHex(tree.getRoot()));
    setProof(JSON.stringify(proof2));
  };

  return (
    <div className="App">
      <ConnectButton />
      {connected && (
        <div>
          <h3>Allowlist addresses</h3>
          <p>Connected address:</p>
          <pre>{accountData?.address}</pre>
          <p>Other addresses:</p>
          <textarea
            value={addresses}
            onChange={(e) => setAddresses(e.target.value)}
          />
          <br />
          <button onClick={(e) => generate()}>Generate</button>
          <br />
          <h3>Root</h3>
          <pre>
            <code>{root}</code>
          </pre>
          <hr />
          <h3>Proof</h3>
          <p>For connected address:</p>
          <pre>
            <code>{proof}</code>
          </pre>
          <p></p>
        </div>
      )}
    </div>
  );
}

export default function Providers() {
  return (
    <WagmiProvider client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <App />
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
