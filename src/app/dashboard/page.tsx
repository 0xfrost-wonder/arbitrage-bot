"use client";
import Link from "next/link";
import { ArrowRightIcon, ReloadIcon } from "@radix-ui/react-icons";

import { Separator } from "@/components/ui/separator";
import { Button, buttonVariants } from "@/components/ui/button";
import { MetamaskProvider, useMetamask } from "@/hooks/useMetamask";
import { useEffect, useState } from "react";
import { useListen } from "@/hooks/useListen";
import { cn } from "@/lib/utils";
import { ethers, utils } from "ethers";
import {
  ARITRAGE_CONTRACT_ADDRESS,
  TOKENS,
  rpcUrl,
  CHAIN_ID,
} from "@/data/address";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageActions } from "@/components/page-header";
import Arbitrage_ABI from "@/abi/Arbitrage.abi.json";
import ERC20_ABI from "@/abi/ERC20.abi.json";

// import { promises as fs } from "fs";
import path from "path";
import { Metadata } from "next";
import Image from "next/image";
import { string, z } from "zod";

import { columns } from "@/components/columns";
import { DataTable } from "@/components/data-table";
import { UserNav } from "@/components/user-nav";
import { Log, logSchema } from "@/data/schema";
import { log } from "console";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { signOut } from "next-auth/react";
import { Label } from "@/components/ui/label";

// Simulate a database read for tasks.
// async function getTasks() {
//   const data = await fs.readFile(
//     path.join(process.cwd(), "src/data/tasks.json")
//   );

//   const tasks = JSON.parse(data.toString());

//   return z.array(eventSchema).parse(tasks);
// }

export default function TaskPage() {
  // const tasks = await getTasks();
  const {
    dispatch,
    state: {
      status,
      isMetamaskInstalled,
      wallet,
      balance,
      tokenBalances,
      chainId,
    },
  } = useMetamask();

  const getArbitrageContract = () => {
    return getContract(ARITRAGE_CONTRACT_ADDRESS, Arbitrage_ABI);
  };

  const { toast } = useToast();

  const listen = useListen();

  const handleConnect = async () => {
    dispatch({ type: "loading" });

    const { ethereum } = window;
    if (!ethereum) {
      return;
    }

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

    try {
      // await window.ethereum.request({
      //   method: "wallet_addEthereumChain",
      //   params: [
      //     {
      //       chainId: CHAIN_ID,
      //       rpcUrls: ["https://goerli.drpc.org/"],
      //       chainName: "Goerli test network",
      //       nativeCurrency: {
      //         name: "GoerliETH",
      //         symbol: "GoerliETH",
      //         decimals: 18,
      //       },
      //       blockExplorerUrls: ["https://goerli.etherscan.io"],
      //     },
      //   ],
      // });

      if (index == 0) {
        TOKENS.forEach(async (token) => {
          addTokenToMetamask(token);
        });
      } else {
        addTokenToMetamask(TOKENS[index]);
      }
    } catch (err: any) {
      showToast("Metamask Setting", err.message);
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

  const getLogs = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      return;
    }
    const provider = new ethers.providers.Web3Provider(ethereum);
    let arbitrageContract = getArbitrageContract();
    if (arbitrageContract == null) return;
    const last_block = await provider.getBlockNumber();
    const events = await arbitrageContract.queryFilter("*", 0, last_block);

    let logs: any[] = [];

    events.forEach((event) => {
      const txHash = event.transactionHash.toString();
      const wallet = event.args?.src.toString();
      const token0Addr = event.args?.t0.toString();
      const token1Addr = event.args?.t1.toString();
      const amountIn = event.args?.ai.toString();
      const amountOut = event.args?.ao.toString();
      const type = event.args?.tp.toString();
      const block = event.args?.wad.toString();

      let token0: any = null,
        token1: any = null;

      TOKENS.forEach((token, index) => {
        if (token.address.toLowerCase() == token0Addr.toLowerCase()) {
          token0 = token;
        }
        if (token.address.toLowerCase() == token1Addr.toLowerCase()) {
          token1 = token;
        }
      });

      logs = [
        {
          id: txHash,
          wallet: wallet,
          token0: token0.symbol ?? "Unknown",
          token1: token1.symbol ?? "Unknown",
          amountIn: roundwithdecimal(amountIn, token0.decimals ?? 0),
          amountOut: roundwithdecimal(amountOut, token0.decimals ?? 0),
          type: type == "0" ? "UNI -> SUS" : "SUS -> UNI",
          block: event.args?.wad.toString() ?? null,
        },
        ...logs,
      ];
    });

    // const events = JSON.parse(data.toString());

    setLogs(z.array(logSchema).parse(logs));
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
    getLogs();
  };

  useEffect(() => {
    if (isMetamaskInstalled && chainId == CHAIN_ID) {
      getBalance();
    }
  }, [isMetamaskInstalled, chainId, wallet]);

  useEffect(() => {
    if (typeof window !== undefined) {
      // start by checking if window.ethereum is present, indicating a wallet extension
      const ethereumProviderInjected = typeof window.ethereum !== "undefined";
      // this could be other wallets so we can verify if we are dealing with metamask
      // using the boolean constructor to be explecit and not let this be used as a falsy value (optional)
      const isMetamaskInstalled =
        ethereumProviderInjected && Boolean(window.ethereum.isMetaMask);
      const chainId = ethereumProviderInjected ? window.ethereum.chainId : "";

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

      dispatch({
        type: "pageLoaded",
        isMetamaskInstalled,
        wallet,
        balance,
        chainId,
      });
      window.ethereum.on("chainChanged", () => window.location.reload());
      interface ConnectInfo {
        chainId: string;
      }

      window.ethereum.on("connect", (connectInfo: ConnectInfo) =>
        console.log(connectInfo)
      );

      if (chainId == CHAIN_ID) {
        handleConnect();
      }
    }
  }, [dispatch, chainId]);

  const roundwithdecimal = (x: string, decimal: number) => {
    return parseInt(x) / Math.pow(10, decimal);
  };

  const [tokenA, setTokenA] = useState<string>();
  const [tokenB, setTokenB] = useState<string>();
  const [loanAmount, setLoanAmount] = useState<string>();

  const showToast = (title: string, description: string) => {
    toast({
      title: title,
      description: description,
    });
  };

  const runBot = async () => {
    if (!tokenA) {
      showToast("Validation", "Select Token A");
      return;
    }

    if (!tokenB) {
      showToast("Validation", "Select Token B");
      return;
    }

    if (tokenA == tokenB) {
      showToast("Validation", "Select different tokens");
      return;
    }

    if (!loanAmount) {
      showToast("Validation", "Input loan amount");
      return;
    }

    const index0 = parseInt(tokenA);
    const index1 = parseInt(tokenB);
    const loan = Math.floor(
      parseFloat(loanAmount) * Math.pow(10, TOKENS[index0].decimals)
    );

    if (loan < 0) {
      showToast("Validation", "Input positive loan amount");
      return;
    }

    if (loan > parseInt(tokenBalances[index0])) {
      showToast("Validation", "Not enough balance");
      return;
    }

    dispatch({ type: "loading" });

    try {
      const balance = loanAmount;
      const amount = ethers.utils.parseUnits(balance, TOKENS[index0].decimals);
      // const amount = loan;
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

        showToast("Running Bot", "Initialize approvement");
        let aproveTxn = await wethContract.approve(
          ARITRAGE_CONTRACT_ADDRESS,
          amount
        );
        await aproveTxn.wait();
        showToast("Running Bot", "Approved");

        showToast("Running Bot", "Initialize abitrage transaction");
        let arbitrageContract = getArbitrageContract();
        if (arbitrageContract == null) return;
        let arbitrageTxn = await arbitrageContract.swap(
          TOKENS[index0].address,
          TOKENS[index1].address,
          amount,
          { gasLimit: 600000 }
        );
        await arbitrageTxn.wait();
        showToast(
          "Running Bot",
          `Arbitrage Success, transaction hash: ${arbitrageTxn.hash}`
        );
        getBalance();
      }
    } catch (err: any) {
      showToast("Running Bot", err.message);
    }

    dispatch({ type: "idle" });
  };

  const [logs, setLogs] = useState<Log[]>([]);

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <PageActions>
          {isMetamaskInstalled && chainId != CHAIN_ID && (
            <Label>{`Change chain to Goerli Network`}</Label>
          )}
          {!isMetamaskInstalled && (
            <Link
              href="https://metamask.io/"
              target="_blank"
              className={cn(buttonVariants(), "rounded-[6px]")}
            >
              Install Metamask
            </Link>
          )}
          {isMetamaskInstalled && chainId == CHAIN_ID && (
            <>
              <Button
                onClick={() => handleAddToken()}
              >{`Can't see Tokens from Metamask?`}</Button>
              <Button onClick={() => getBalance()}>{`Balance Reload`}</Button>
            </>
          )}
          <Button onClick={() => signOut()}>{`Logout`}</Button>
        </PageActions>

        {isMetamaskInstalled && chainId == CHAIN_ID && (
          <PageActions>
            {wallet && <Label>Wallet address: {wallet}</Label>}
          </PageActions>
        )}

        {isMetamaskInstalled && chainId == CHAIN_ID && (
          <PageActions>
            <div className="flex w-full max-w-[750px] items-center space-x-2">
              <Select
                onValueChange={(value) => {
                  setTokenA(value);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Token A" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Token A</SelectLabel>
                    {TOKENS.map((token, index) => {
                      return (
                        <SelectItem key={index} value={index.toString()}>
                          {token.symbol}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                onValueChange={(value) => {
                  setTokenB(value);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Token B" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Token B</SelectLabel>
                    {TOKENS.map((token, index) => {
                      return (
                        <SelectItem key={index} value={index.toString()}>
                          {token.symbol}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Input
                className="w-[200px]"
                type="number"
                placeholder="Loan Amount"
                onChange={(event) => {
                  setLoanAmount(event.target.value);
                }}
              />

              {status == "loading" && (
                <Button disabled>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </Button>
              )}
              {status != "loading" && (
                <Button onClick={() => runBot()}>{`Run Bot`}</Button>
              )}
            </div>
          </PageActions>
        )}

        {isMetamaskInstalled && chainId == CHAIN_ID && (
          <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
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
          </div>
        )}
        {isMetamaskInstalled && chainId == CHAIN_ID && (
          <DataTable data={logs} columns={columns} />
        )}
      </div>
    </>
  );
}
