export interface SignalMessage<T extends PayloadBase> {
  senderId: string;
  receiverId: string;
  messageType: MessageType;
  payload: T;
  sentAt: number | null; // Added by server when sending back
}

export enum MessageType {
  TransferRequest,
  TransferResponse,
  TransferComplete,
  ReadyToReceive,
  TransferStatistics,
}

export interface PayloadBase {
  operationId: string;
}

export interface TransferRequest extends PayloadBase {
  itemName: string;
  itemSizeBytes: number;
}

export interface TransferResponse extends PayloadBase {
  isApproved: boolean;
  rejectionReason?: string; // Optional field for rejection reason
}

export interface TransferComplete extends PayloadBase {
  isSuccessful: boolean;
  durationSeconds: number;
}

export interface ReadyToReceive extends PayloadBase {}

export interface TransferStatistics extends PayloadBase {
  transferredSizeBytes: number;
}
