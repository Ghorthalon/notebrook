let audioContext: AudioContext | null = null;
let soundsLoaded = false;

function getAudioContext(): AudioContext {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
}

const soundFiles = {
    intro: 'intro.wav',
    login: 'login.wav',
    copy: 'copy.wav',
    uploadFailed: 'uploadfail.wav'
} as const;

type SoundName = keyof typeof soundFiles;

const sounds: Partial<Record<SoundName, AudioBuffer>> = {};

const waterSounds: AudioBuffer[] = [];
const sentSounds: AudioBuffer[] = [];

async function loadSound(url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await getAudioContext().decodeAudioData(arrayBuffer);
}

async function loadAllSounds() {
    for (const key in soundFiles) {
        const soundName = key as SoundName;
        sounds[soundName] = await loadSound(soundFiles[soundName]);
    }

    for (let i = 1; i <= 10; i++) {
        const buffer = await loadSound(`water${i}.wav`);
        waterSounds.push(buffer);
    }

    for (let i = 1; i <= 6; i++) {
        const buffer = await loadSound(`sent${i}.wav`);
        sentSounds.push(buffer);
    }
}

async function ensureSoundsLoaded() {
    if (!soundsLoaded) {
        soundsLoaded = true;
        await loadAllSounds();
    }
}

async function playSoundBuffer(buffer: AudioBuffer) {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
        await ctx.resume();
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
}

export async function playSound(name: SoundName) {
    await ensureSoundsLoaded();
    const buffer = sounds[name];
    if (buffer) {
        await playSoundBuffer(buffer);
    }
}

export async function playWater() {
    await ensureSoundsLoaded();
    if (waterSounds.length > 0) {
        const sound = waterSounds[Math.floor(Math.random() * waterSounds.length)];
        await playSoundBuffer(sound);
    }
}

export async function playSent() {
    await ensureSoundsLoaded();
    if (sentSounds.length > 0) {
        const sound = sentSounds[Math.floor(Math.random() * sentSounds.length)];
        await playSoundBuffer(sound);
    }
}
