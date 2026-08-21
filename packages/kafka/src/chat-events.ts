export type SenderKind = 'user' | 'seller';

export interface ChatMessageEvent {
  conversationId: string;
  senderId: string;
  senderType: SenderKind;
  content: string;
  attachments: string[];
  createdAt: string;
}
