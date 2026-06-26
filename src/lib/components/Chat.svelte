<script lang="ts">
  import { tick } from 'svelte';
  let { user } = $props<{ user: any }>();

  let isOpen = $state(false);
  let chatInput = $state('');
  let messages = $state([
    { sender: 'Ravi Kumar (Sales)', text: 'Hi team, anyone available to check hotel tariff for Maldives voucher?', type: 'received' },
    { sender: 'Divya Nair (Ops)', text: 'Yes Ravi, Anantara tariffs are updated in Master Management. Let me know if you need help.', type: 'received' }
  ]);

  let chatMessagesEl = $state<HTMLDivElement>();
  let chatInputEl = $state<HTMLInputElement>();

  async function scrollToBottom() {
    await tick();
    if (chatMessagesEl) {
      chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    }
  }

  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => chatInputEl?.focus(), 50);
    }
  }

  function sendChatMessage() {
    const text = chatInput.trim();
    if (!text) return;

    messages.push({
      sender: `You (${user.name})`,
      text: text,
      type: 'sent'
    });

    chatInput = '';
    scrollToBottom();

    // Simulate automated reply
    setTimeout(() => {
      messages.push({
        sender: 'Sneha Patel (Sales)',
        text: 'Acknowledged! Will review right away.',
        type: 'received'
      });
      scrollToBottom();
    }, 1000);
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  }
</script>

<div class="chat-widget" id="teamChatWidget">
  <button class="chat-btn" onclick={toggleChat} id="chatToggleBtn" type="button">
    <i class="ti ti-messages"></i>
  </button>
  <div class="chat-popup" class:open={isOpen} id="chatPopup">
    <div class="chat-header">
      <h3><i class="ti ti-users-group"></i> Internal Team Chat</h3>
      <button class="chat-close" onclick={toggleChat} type="button">✕</button>
    </div>
    <div class="chat-messages" bind:this={chatMessagesEl} id="chatMessages">
      {#each messages as msg}
        <div class="msg-bubble" class:msg-sent={msg.type === 'sent'} class:msg-received={msg.type === 'received'}>
          <div class="msg-meta">{msg.sender}</div>
          {msg.text}
        </div>
      {/each}
    </div>
    <div class="chat-input-area">
      <input 
        type="text" 
        bind:this={chatInputEl} 
        bind:value={chatInput} 
        id="chatInput"
        placeholder="Type a message..." 
        onkeypress={handleKeyPress}
      >
      <button onclick={sendChatMessage} type="button"><i class="ti ti-send"></i></button>
    </div>
  </div>
</div>
