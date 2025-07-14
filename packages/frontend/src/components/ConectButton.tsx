import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AlertTriangle, Wallet } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export const WrappedConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const connected = mounted && !!account && !!chain;

        if (!mounted)
          return (
            <Button disabled variant="secondary">
              Loading wallet…
            </Button>
          );

        if (!connected)
          return (
            <Button onClick={openConnectModal}>
              <Wallet className="h-4 w-4" />
              Connect&nbsp;Wallet
            </Button>
          );

        if (chain.unsupported) {
          return (
            <Button variant="destructive" onClick={openChainModal}>
              <AlertTriangle className="h-4 w-4" />
              Wrong&nbsp;Network
            </Button>
          );
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Wallet className="h-4 w-4" />
                {account.displayName}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              <DropdownMenuItem onClick={openAccountModal}>Account&nbsp;details</DropdownMenuItem>
              <DropdownMenuItem onClick={openChainModal}>Change&nbsp;network</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }}
    </ConnectButton.Custom>
  );
};
