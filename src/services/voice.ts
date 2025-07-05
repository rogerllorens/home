import Voice from 'react-native-voice';
import Tts from 'react-native-tts';

let callback: ((cmd: string) => void) | null = null;
const customCommands: { phrase: string; actions: (() => void)[] }[] = [];

export function initVoice(onCommand: (cmd: string) => void): void {
  callback = onCommand;
  Voice.onSpeechResults = event => {
    if (!callback || !event.value || !event.value.length) return;
    const text = event.value[0].toLowerCase();
    const custom = customCommands.find(c => text.includes(c.phrase));
    if (custom) {
      custom.actions.forEach(a => a());
    } else {
      callback(text);
    }
  };
}

export function startListening(): void {
  Voice.start('es-ES');
}

export function stopListening(): void {
  Voice.stop();
}

export function speak(text: string): void {
  Tts.speak(text);
}

export function addVoiceCommand(phrase: string, actions: (() => void)[]): void {
  customCommands.push({ phrase: phrase.toLowerCase(), actions });
}
