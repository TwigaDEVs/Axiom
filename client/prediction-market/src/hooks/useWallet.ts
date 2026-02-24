import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract, type Signer, type JsonRpcSigner } from "ethers";
import ABI from "../abi/PredictionMarket.json";
import { CONTRACT_ADDRESS, CHAIN_CONFIG } from "../utils/constants";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletState {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  address: string | null;
  chainId: number | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useWallet(): WalletState {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or another wallet.");
      return;
    }
    setConnecting(true);
    try {
      const p = new BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: CHAIN_CONFIG.chainId }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [CHAIN_CONFIG],
          });
        }
      }

      const s = await p.getSigner();
      const addr = await s.getAddress();
      const net = await p.getNetwork();

      setProvider(p);
      setSigner(s);
      setAddress(addr);
      setChainId(Number(net.chainId));
    } catch (err) {
      console.error("Connect failed:", err);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setChainId(null);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccounts = (accounts: string[]) => {
      if (accounts.length === 0) disconnect();
      else setAddress(accounts[0]);
    };
    const handleChain = () => window.location.reload();

    window.ethereum.on("accountsChanged", handleAccounts);
    window.ethereum.on("chainChanged", handleChain);
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccounts);
      window.ethereum?.removeListener("chainChanged", handleChain);
    };
  }, [disconnect]);

  return { provider, signer, address, chainId, connecting, connect, disconnect };
}

export function useContract(signer: Signer | null, provider: BrowserProvider | null) {
  const getReadContract = useCallback((): Contract | null => {
    const p = provider || (window.ethereum ? new BrowserProvider(window.ethereum) : null);
    if (!p) return null;
    return new Contract(CONTRACT_ADDRESS, ABI, p);
  }, [provider]);

  const getWriteContract = useCallback((): Contract | null => {
    if (!signer) return null;
    return new Contract(CONTRACT_ADDRESS, ABI, signer);
  }, [signer]);

  return { getReadContract, getWriteContract };
}
