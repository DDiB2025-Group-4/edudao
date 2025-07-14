import { createThirdwebClient } from "thirdweb";
import { THIRDWEBCLIENT_ID } from "@/constants";

export const thirdwebClient = createThirdwebClient({
  clientId: THIRDWEBCLIENT_ID,
});
