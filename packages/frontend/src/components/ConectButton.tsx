import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";
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
        const ready = mounted;
        const connected = ready && !!account && !!chain && !chain?.unsupported;

        if (!ready)
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
