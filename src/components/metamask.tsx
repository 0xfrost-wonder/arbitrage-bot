"use client";
import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";

import { Separator } from "@/components/ui/separator";
import { Button, buttonVariants } from "./ui/button";
import { MetamaskProvider, useMetamask } from "../hooks/useMetamask";
import { useEffect } from "react";
import { useListen } from "../hooks/useListen";
import { cn } from "@/lib/utils";
import { ethers } from "ethers";
import { ARITRAGE_CONTRACT_ADDRESS, TOKENS, rpcUrl } from "@/data/address";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { PageActions } from "./page-header";
import Arbitrage_ABI from "@/abi/Arbitrage.abi.json";
import ERC20_ABI from "@/abi/ERC20.abi.json";

export function Metamask() {
  const {
    dispatch,
    state: { status, isMetamaskInstalled, wallet, balance, tokenBalances },
  } = useMetamask();

  const listen = useListen();

  const handleConnect = async () => {

    const { ethereum } = window;

    if (!ethereum) {
      return;
    }

    dispatch({ type: "loading" });
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (accounts.length > 0) {
      const balance = await window.ethereum!.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      });
      dispatch({ type: "connect", wallet: accounts[0], balance });

      // we can register an event listener for changes to the users wallet
      listen();
    }
  };

  const addTokenToMetamask = async (token: any) => {
    await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: token,
      },
    });
  };

  const handleAddToken = async (index = 0) => {
    dispatch({ type: "loading" });

    if (index == 0) {
      TOKENS.forEach(async (token) => {
        addTokenToMetamask(token);
      });
    } else {
      addTokenToMetamask(TOKENS[index]);
    }

    dispatch({ type: "idle" });
  };
  // handleAddToken(0);

  const getContract = (address: string, abi: ethers.ContractInterface) => {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      return new ethers.Contract(address, abi, signer);
    }
    return null;
  };

  const getBalanceOfToken = (index: number) => {
    const token_contract = getContract(TOKENS[index].address, ERC20_ABI);
    if (token_contract == null) {
      return;
    }
    token_contract.balanceOf(wallet).then((amount: BigInteger) => {
      let new_tokenBalances = tokenBalances;
      new_tokenBalances[index] = amount.toString();
      dispatch({
        type: "token_balance",
        tokenBalances: new_tokenBalances,
      });
    });
  };

  const getBalance = async (index = -1) => {
    if (wallet == null) {
      return;
    }
    if (index == -1) {
      TOKENS.map((token, index) => {
        getBalanceOfToken(index);
      });
    } else {
      getBalanceOfToken(index);
    }
  };

  useEffect(() => {
    getBalance();
  }, [wallet]);

  useEffect(() => {
    if (typeof window !== undefined) {
      // start by checking if window.ethereum is present, indicating a wallet extension
      const ethereumProviderInjected = typeof window.ethereum !== "undefined";
      // this could be other wallets so we can verify if we are dealing with metamask
      // using the boolean constructor to be explecit and not let this be used as a falsy value (optional)
      const isMetamaskInstalled =
        ethereumProviderInjected && Boolean(window.ethereum.isMetaMask);

      const local = window.localStorage.getItem("metamaskState");

      // user was previously connected, start listening to MM
      if (local) {
        listen();
      }

      // local could be null if not present in LocalStorage
      const { wallet, balance } = local
        ? JSON.parse(local)
        : // backup if local storage is empty
          { wallet: null, balance: null };

      dispatch({ type: "pageLoaded", isMetamaskInstalled, wallet, balance });
      handleConnect();
    }
  }, []);

  const roundwithdecimal = (x: string, decimal: number) => {
    return parseInt(x) / Math.pow(10, decimal);
  };

  const runBot = async (index0 = 0, index1 = 1) => {
    dispatch({ type: "loading" });
    try {
      const balance = "0.001";
      // const amount = utils.formatEther(balance);
      const amount = ethers.utils.parseUnits(balance, "ether");
      // await getUniswapOutAmount(amount);

      // return;

      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wethContract = new ethers.Contract(
          TOKENS[index0].address,
          ERC20_ABI,
          signer
        );

        console.log("Initialize approvement");
        let aproveTxn = await wethContract.approve(
          ARITRAGE_CONTRACT_ADDRESS,
          amount
        );
        await aproveTxn.wait();
        console.log("Approving... please wait");
        let arbitrageContract = new ethers.Contract(
          ARITRAGE_CONTRACT_ADDRESS,
          Arbitrage_ABI,
          signer
        );

        console.log("Initialize abitrage transaction");
        let arbitrageTxn = await arbitrageContract.swap(
          TOKENS[index0].address,
          TOKENS[index1].address,
          amount,
          { gasLimit: 600000 }
        );
        await arbitrageTxn.wait();
        console.log(
          `Arbitrage Success, transaction hash: ${arbitrageTxn.hash}`
        );
        getBalance();
      }
    } catch (err) {
      console.log(err);
    }
    dispatch({ type: "idle" });
  };
  return (
    <>
      <PageActions>
        {!isMetamaskInstalled && (
          <Link
            href="https://metamask.io/"
            target="_blank"
            className={cn(buttonVariants(), "rounded-[6px]")}
          >
            Install Metamask
          </Link>
        )}
        {isMetamaskInstalled && (
          <>
            <Button
              onClick={() => handleAddToken()}
            >{`Can't see Tokens from Metamask?`}</Button>
            <Button onClick={() => getBalance()}>{`Balance Reload`}</Button>
            <Button onClick={() => runBot()}>{`Run Bot`}</Button>
          </>
        )}
      </PageActions>

      {isMetamaskInstalled && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow key={`ETH`}>
              <TableCell> {`ETH`}</TableCell>
              <TableCell>{roundwithdecimal(balance, 18)}</TableCell>
            </TableRow>
            {tokenBalances.map((balance, index) => {
              return (
                <TableRow key={TOKENS[index].symbol}>
                  <TableCell> {TOKENS[index].symbol}</TableCell>
                  <TableCell>
                    {roundwithdecimal(balance, TOKENS[index].decimals)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </>
  );
}
