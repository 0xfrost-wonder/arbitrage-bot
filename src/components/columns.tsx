"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Log } from "../data/schema";
import { DataTableColumnHeader } from "./data-table-column-header";
import Link from "next/link";
import { buttonVariants } from "./ui/button";

const shortenAddress = (address: string) => {
  const prefix = address.slice(0, 6);
  const suffix = address.slice(-6);
  return `${prefix}...${suffix}`;
};

export const columns: ColumnDef<Log>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Txn Number" />
    ),
    cell: ({ row }) => (
      <div className="w-[120px]">
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={"https://goerli.etherscan.io/tx/" + row.getValue("id")}
          target="_blank"
        >
          {shortenAddress(row.getValue("id"))}
        </Link>
      </div>
    ),
  },
  {
    accessorKey: "wallet",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Wallet Address" />
    ),
    cell: ({ row }) => (
      <div className="w-[120px]">
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={"https://goerli.etherscan.io/address/" + row.getValue("wallet")}
          target="_blank"
        >
          {shortenAddress(row.getValue("wallet"))}
        </Link>
      </div>
    ),
  },
  {
    accessorKey: "token0",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="TokenA" />
    ),
    cell: ({ row }) => <div className="w-[40px]">{row.getValue("token0")}</div>,
  },
  {
    accessorKey: "token1",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="TokenB" />
    ),
    cell: ({ row }) => <div className="w-[40px]">{row.getValue("token1")}</div>,
  },
  {
    accessorKey: "amountIn",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount In" />
    ),
    cell: ({ row }) => (
      <div className="w-[160px]">{row.getValue("amountIn")}</div>
    ),
  },
  {
    accessorKey: "amountOut",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount Out" />
    ),
    cell: ({ row }) => (
      <div className="w-[160px]">{row.getValue("amountOut")}</div>
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => <div className="w-[80px]">{row.getValue("type")}</div>,
  },
  {
    accessorKey: "block",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Block Time" />
    ),
    cell: ({ row }) => <div className="w-[80px]">{row.getValue("block")}</div>,
  },
];
