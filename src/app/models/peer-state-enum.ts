export enum PeerState{
    Disconnected,
    Error,
    Connected,
    Open, // channel is ready.
    Sending, // sending to peer.
    Receiving, // receiving from peer.
    WaitingToSend, // peer have to accept a sending file.
    WaitingToReceive // user have to accept a receiving file. 
}