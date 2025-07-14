import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AlertTriangle, Wallet } from "lucide-react";
import type { FC } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export const WrappedConnectButton: FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const connected = mounted && !!account && !!chain;

        if (!mounted)
          return (
            <Button disabled variant="secondary" className={className}>
              Loading wallet…
            </Button>
          );

        if (!connected)
          return (
            <Button onClick={openConnectModal} className={className}>
              <Wallet className="h-4 w-4" />
              Connect&nbsp;Wallet
            </Button>
          );

        if (chain.unsupported) {
          return (
            <Button variant="destructive" onClick={openChainModal} className={className}>
              <AlertTriangle className="h-4 w-4" />
              Wrong&nbsp;Network
            </Button>
          );
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={className}>
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
