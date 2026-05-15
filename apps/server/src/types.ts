import type { ClientRole } from "@share-slides/shared";

export type ConnectedClient = {
  id: string;
  socketId: string;
  name: string;
  role: ClientRole;
  roomId: string;
  isController: boolean;
};
