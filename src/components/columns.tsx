"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Log } from "../data/schema";
import { DataTableColumnHeader } from "./data-table-column-header";

export const columns: ColumnDef<Log>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Transaction Number" />
    ),
    cell: ({ row }) => <div className="w-[80px]">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "wallet",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Wallet Address" />
    ),
    cell: ({ row }) => <div className="w-[80px]">{row.getValue("wallet")}</div>,
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
