import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

const files = {
  messageBubble: readFileSync(resolve(root, 'src/components/chat/MessageBubble.tsx'), 'utf8'),
  chatInput: readFileSync(resolve(root, 'src/components/chat/ChatInput.tsx'), 'utf8'),
  chatPage: readFileSync(resolve(root, 'src/pages/ChatPage.tsx'), 'utf8'),
  css: readFileSync(resolve(root, 'src/styles/global.css'), 'utf8'),
};

const checks = [
  ['MessageBubble renders semantic row class', files.messageBubble.includes('chat-message-row')],
  ['MessageBubble renders semantic avatar class', files.messageBubble.includes('chat-message-avatar')],
  ['MessageBubble renders semantic bubble class', files.messageBubble.includes('chat-message-bubble')],
  ['MessageBubble renders semantic time class', files.messageBubble.includes('chat-message-time')],
  ['ChatInput renders composer root class', files.chatInput.includes('chat-composer')],
  ['ChatInput renders composer textarea class', files.chatInput.includes('chat-composer-textarea')],
  ['ChatInput renders composer action class', files.chatInput.includes('chat-composer-action')],
  ['ChatInput renders composer submit class', files.chatInput.includes('chat-composer-submit')],
  ['Typing indicator uses assistant message row class', files.chatPage.includes('chat-message-row assistant typing')],
  ['CSS styles assistant bubbles', files.css.includes('.chat-message-bubble.assistant')],
  ['CSS styles user bubbles', files.css.includes('.chat-message-bubble.user')],
  ['CSS styles message avatars', files.css.includes('.chat-message-avatar')],
  ['CSS styles composer root', files.css.includes('.chat-composer')],
  ['CSS includes mobile message stack width', files.css.includes('max-width: 84%')],
];

const failures = checks.filter(([, passed]) => !passed);

if (failures.length > 0) {
  console.error('Chat UI surface verification failed:');
  for (const [label] of failures) {
    console.error(`- ${label}`);
  }
  process.exit(1);
}

console.log(`Chat UI surface verification passed (${checks.length} checks).`);
