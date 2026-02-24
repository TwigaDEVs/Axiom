import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import MarketsList from "./components/MarketsList";
import CreateMarket from "./components/CreateMarket";
import MarketDetail from "./components/MarketDetail";
import LookupMarket from "./components/LookupMarket";
import { useWallet, useContract } from "./hooks/useWallet";

export default function App() {
  const { provider, signer, address, connecting, connect, disconnect } = useWallet();
  const { getReadContract, getWriteContract } = useContract(signer, provider);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1e1e2a",
              color: "#e8e8f0",
              border: "1px solid #2a2a3a",
              fontFamily: "'Outfit', sans-serif",
            },
          }}
        />

        <Header
          address={address}
          connecting={connecting}
          onConnect={connect}
          onDisconnect={disconnect}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto p-6">
          <Routes>
            <Route
              path="/"
              element={<MarketsList getReadContract={getReadContract} provider={provider} />}
            />
            <Route
              path="/create"
              element={
                <CreateMarket signer={signer} getWriteContract={getWriteContract} address={address} />
              }
            />
            <Route
              path="/market/:marketId"
              element={<MarketDetail getReadContract={getReadContract} address={address} />}
            />
            <Route
              path="/lookup"
              element={<LookupMarket getReadContract={getReadContract} />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
