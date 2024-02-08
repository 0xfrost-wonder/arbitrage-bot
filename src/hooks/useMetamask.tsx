'use client'
import React, { useEffect, type PropsWithChildren } from "react";

type ConnectAction = { type: "connect"; wallet: string; balance: string };
type DisconnectAction = { type: "disconnect" };
type PageLoadedAction = {
  type: "pageLoaded";
  isMetamaskInstalled: boolean;
  wallet: string;
  balance: string;
  chainId: string;
};
type LoadingAction = { type: "loading" };
type IdleAction = { type: "idle" };
type TokenBalanceAction = {
  type: "token_balance";
  tokenBalances: string[];
}

type Action =
  | ConnectAction
  | DisconnectAction
  | PageLoadedAction
  | LoadingAction
  | IdleAction
  | TokenBalanceAction;

type Dispatch = (action: Action) => void;

type Status = "loading" | "idle" | "pageNotLoaded";

type State = {
  wallet: string | null;
  isMetamaskInstalled: boolean;
  status: Status;
  balance: string;
  tokenBalances: string[];
  chainId: string;
};

const initialState: State = {
  wallet: null,
  isMetamaskInstalled: false,
  status: "loading",
  balance: "0",
  tokenBalances: [],
  chainId: ""
} as const;

function metamaskReducer(state: State, action: Action): State {
  switch (action.type) {
    case "connect": {
      const { wallet, balance } = action;
      const newState = { ...state, wallet, balance, status: "idle" } as State;
      const info = JSON.stringify(newState);
      window.localStorage.setItem("metamaskState", info);

      return newState;
    }
    case "disconnect": {
      window.localStorage.removeItem("metamaskState");
      if (typeof window.ethereum !== undefined) {
        window.ethereum.removeAllListeners(["accountsChanged"]);
      }
      return { ...state, wallet: null, balance: "0" };
    }
    case "pageLoaded": {
      const { isMetamaskInstalled, balance, wallet, chainId } = action;
      return { ...state, isMetamaskInstalled, status: "idle", wallet, balance, chainId };
    }
    case "loading": {
      return { ...state, status: "loading" };
    }
    case "idle": {
      return { ...state, status: "idle" };
    }
    case "token_balance": {
      const { tokenBalances } = action;
      return { ... state, tokenBalances};
    }

    default: {
      throw new Error("Unhandled action type");
    }
  }
}

const MetamaskContext = React.createContext<
  { state: State; dispatch: Dispatch } | undefined
>(undefined);

function MetamaskProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = React.useReducer(metamaskReducer, initialState);
  const value = { state, dispatch };

  return (
    <MetamaskContext.Provider value={value}>
      {children}
    </MetamaskContext.Provider>
  );
}

function useMetamask() {
  const context = React.useContext(MetamaskContext);
  if (context === undefined) {
    throw new Error("useMetamask must be used within a MetamaskProvider");
  }
  return context;
}

export { MetamaskProvider, useMetamask };
