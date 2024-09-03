const audioContext = new AudioContext();

const soundFiles = {
    intro: 'intro.wav',
    login: 'login.wav',
    uploadFailed: 'uploadfail.wav'
} as const;

type SoundName = keyof typeof soundFiles;

const sounds: Partial<Record<SoundName, AudioBuffer>> = {};

const waterSounds: AudioBuffer[] = [];
const sentSounds: AudioBuffer[] = [];

async function loadSound(url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
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

function playSoundBuffer(buffer: AudioBuffer) {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
}

export function playSound(name: SoundName) {
    const buffer = sounds[name];
    if (buffer) {
        playSoundBuffer(buffer);
    } else {
        console.error(`Sound ${name} not loaded.`);
    }
}

export function playWater() {
    if (waterSounds.length > 0) {
        const sound = waterSounds[Math.floor(Math.random() * waterSounds.length)];
        playSoundBuffer(sound);
    } else {
        console.error("Water sounds not loaded.");
    }
}

export function playSent() {
    if (sentSounds.length > 0) {
        const sound = sentSounds[Math.floor(Math.random() * sentSounds.length)];
        playSoundBuffer(sound);
    } else {
        console.error("Sent sounds not loaded.");
    }
}

loadAllSounds().then(() => {
    console.log('All sounds loaded and ready to play');
}).catch(error => {
    console.error('Error loading sounds:', error);
});
