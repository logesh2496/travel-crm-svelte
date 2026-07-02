<script lang="ts">
  import { tick, onMount, onDestroy } from 'svelte';
  import { subscribeToMessages, sendChatMessage, type ChatMessage } from '$lib/firebase/chat.db';

  let { user } = $props<{ user: any }>();

  let isOpen = $state(false);
  let chatInput = $state('');
  let messages = $state<ChatMessage[]>([]);
  let chatMessagesEl = $state<HTMLDivElement>();
  let chatInputEl = $state<HTMLInputElement>();
  
  let unsubscribe: (() => void) | undefined;
  let messageLimit = $state(20);
  let replyingTo = $state<ChatMessage | null>(null);
  let isAtBottom = $state(true);
  let isLoading = $state(false);

  function getSenderId() {
    return user.email || user.name || 'unknown_id';
  }

  // Initialize chat subscription
  function initSubscription() {
    if (unsubscribe) unsubscribe();
    
    unsubscribe = subscribeToMessages(messageLimit, async (newMessages) => {
      let prevHeight = 0;
      let prevScrollTop = 0;
      
      if (chatMessagesEl && !isAtBottom) {
        prevHeight = chatMessagesEl.scrollHeight;
        prevScrollTop = chatMessagesEl.scrollTop;
      }

      messages = newMessages;
      isLoading = false;

      await tick();
      
      if (chatMessagesEl) {
        if (isAtBottom) {
          // If at bottom, auto scroll to new message
          chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
        } else if (prevHeight > 0) {
          // If we loaded older messages, restore scroll position
          const newHeight = chatMessagesEl.scrollHeight;
          chatMessagesEl.scrollTop = prevScrollTop + (newHeight - prevHeight);
        }
      }
    });
  }

  onMount(() => {
    initSubscription();
  });

  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });

  function handleScroll() {
    if (!chatMessagesEl) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatMessagesEl;
    
    // Check if user is at the bottom
    isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;

    // Load more if user scrolls to top
    if (scrollTop === 0 && !isLoading && messages.length >= messageLimit) {
      isLoading = true;
      messageLimit += 20;
      initSubscription();
    }
  }

  async function scrollToBottom() {
    await tick();
    if (chatMessagesEl) {
      chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
      isAtBottom = true;
    }
  }

  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => chatInputEl?.focus(), 50);
    }
  }

  async function handleSendMessage() {
    const text = chatInput.trim();
    if (!text) return;

    chatInput = '';
    const replyData = replyingTo ? {
      id: replyingTo.id!,
      text: replyingTo.text,
      senderName: replyingTo.senderName
    } : undefined;
    
    replyingTo = null;
    isAtBottom = true; // force scroll to bottom on own message
    
    try {
      await sendChatMessage(text, getSenderId(), user.name || 'Unknown User', replyData);
      scrollToBottom();
    } catch (err) {
      console.error("Failed to send", err);
    }
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  }
  
  function initiateReply(msg: ChatMessage) {
    replyingTo = msg;
    chatInputEl?.focus();
  }
  
  function cancelReply() {
    replyingTo = null;
  }
</script>

<div class="chat-widget" id="teamChatWidget">
  <button class="chat-btn" onclick={toggleChat} id="chatToggleBtn" type="button">
    <i class="ti ti-messages"></i>
  </button>
  <div class="chat-popup" class:open={isOpen} id="chatPopup">
    <div class="chat-header">
      <h3><i class="ti ti-users-group"></i> Org Team Chat</h3>
      <button class="chat-close" onclick={toggleChat} type="button">✕</button>
    </div>
    
    <div class="chat-messages" bind:this={chatMessagesEl} onscroll={handleScroll} id="chatMessages">
      {#if isLoading}
        <div class="chat-loading-skeleton">
          <div class="skeleton-bubble left"></div>
          <div class="skeleton-bubble right"></div>
          <div class="skeleton-bubble left"></div>
        </div>
      {/if}
      
      {#each messages as msg (msg.id)}
        <div class="msg-bubble" 
             class:msg-sent={msg.senderId === getSenderId()} 
             class:msg-received={msg.senderId !== getSenderId()}>
             
          <div class="msg-meta">
            <span class="sender-name">
              {msg.senderName}
              <span class="msg-time">
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
              </span>
            </span>
            <button class="reply-action-btn" onclick={() => initiateReply(msg)} title="Reply" type="button">
              <i class="ti ti-arrow-back-up"></i>
            </button>
          </div>
          
          {#if msg.replyTo}
            <div class="quoted-msg">
              <div class="quoted-sender">{msg.replyTo.senderName}</div>
              <div class="quoted-text">{msg.replyTo.text}</div>
            </div>
          {/if}
          
          <div class="msg-text">{msg.text}</div>
        </div>
      {/each}
    </div>
    
    <div class="chat-input-container">
      {#if replyingTo}
        <div class="reply-preview">
          <div class="reply-preview-content">
            <span class="reply-preview-sender">Replying to {replyingTo.senderName}</span>
            <span class="reply-preview-text">{replyingTo.text}</span>
          </div>
          <button class="cancel-reply-btn" onclick={cancelReply} type="button">✕</button>
        </div>
      {/if}
      <div class="chat-input-area">
        <input 
          type="text" 
          bind:this={chatInputEl} 
          bind:value={chatInput} 
          id="chatInput"
          placeholder="Type a message..." 
          onkeypress={handleKeyPress}
        >
        <button onclick={handleSendMessage} type="button"><i class="ti ti-send"></i></button>
      </div>
    </div>
  </div>
</div>

<style>
  .chat-loading-skeleton {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  }
  .skeleton-bubble {
    height: 36px;
    border-radius: 8px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  .skeleton-bubble.left {
    width: 65%;
    align-self: flex-start;
  }
  .skeleton-bubble.right {
    width: 55%;
    align-self: flex-end;
  }
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  .msg-bubble {
    position: relative;
    padding: 6px 10px !important;
  }
  
  .msg-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
  }

  .msg-meta .sender-name {
    font-size: 0.7rem;
    font-weight: 600;
    opacity: 0.8;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .reply-action-btn {
    background: none;
    border: none;
    color: rgba(0,0,0,0.4);
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s, color 0.2s;
    padding: 0 4px;
    font-size: 1.1rem;
    border-radius: 4px;
  }
  
  .msg-bubble:hover .reply-action-btn {
    opacity: 1;
  }
  
  .reply-action-btn:hover {
    color: rgba(0,0,0,0.8);
    background: rgba(0,0,0,0.05);
  }

  .msg-sent .reply-action-btn {
    color: rgba(255,255,255,0.6);
  }

  .msg-sent .reply-action-btn:hover {
    color: rgba(255,255,255,1);
    background: rgba(255,255,255,0.1);
  }
  
  .quoted-msg {
    background: rgba(0,0,0,0.05);
    border-left: 3px solid #007bff;
    padding: 6px 8px;
    margin: 4px 0 8px 0;
    border-radius: 4px;
    font-size: 0.85rem;
    cursor: pointer;
  }
  
  .msg-sent .quoted-msg {
    background: rgba(255,255,255,0.2);
    border-left-color: #fff;
  }
  
  .quoted-sender {
    font-weight: 600;
    font-size: 0.75rem;
    margin-bottom: 2px;
  }
  
  .quoted-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0.9;
  }

  .msg-text {
    word-break: break-word;
    font-size: 0.9rem;
    line-height: 1.4;
  }
  
  .msg-time {
    font-size: 0.6rem;
    font-weight: normal;
    opacity: 0.6;
  }

  .chat-input-container {
    display: flex;
    flex-direction: column;
    border-top: 1px solid #eee;
    background: #fff;
    border-radius: 0 0 12px 12px;
  }
  
  .reply-preview {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background: #f8f9fa;
    border-left: 4px solid #007bff;
    border-bottom: 1px solid #eee;
  }
  
  .reply-preview-content {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex: 1;
  }
  
  .reply-preview-sender {
    font-weight: 600;
    font-size: 0.8rem;
    color: #007bff;
    margin-bottom: 2px;
  }
  
  .reply-preview-text {
    font-size: 0.85rem;
    color: #555;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .cancel-reply-btn {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 4px 8px;
    font-size: 1.2rem;
    border-radius: 4px;
  }
  
  .cancel-reply-btn:hover {
    color: #333;
    background: #e9ecef;
  }
</style>
