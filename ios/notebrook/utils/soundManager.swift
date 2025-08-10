import AVFoundation
import Foundation

class SoundItem {
    var EXTENSION = "m4a"
    var soundID: String
    var player: AVAudioPlayer
    var file: AVAudioFile?

    var filename: String

    var volume: Float {
        get { player.volume }
        set { player.volume = newValue }
    }

    var duration: Int {
        Int(player.duration * 1000)
    }

    var pan: Float {
        get { player.pan }
        set { player.pan = newValue }
    }

    var loop: Bool {
        get { player.numberOfLoops != 0 }
        set { player.numberOfLoops = newValue ? -1 : 0 }
    }

    init?(_ fileName: String) {
        guard let fileURL = Bundle.main.url(forResource: fileName, withExtension: EXTENSION) else {
            print("Error: Could not find file \(fileName).m4a in bundle.")
            return nil
        }

        do {
            player = try AVAudioPlayer(contentsOf: fileURL)
            player.prepareToPlay()
        } catch {
            print("Error: Could not create AVAudioPlayer - \(error.localizedDescription)")
            return nil
        }

        filename = fileName
        soundID = UUID().uuidString
    }

    func checkNext() {}

    func play() {
        player.play()
    }

    func stop() {
        player.stop()
    }

    func replay() {
        player.stop()
        player.currentTime = 0
        player.play()
    }

    func pause() {
        player.pause()
    }

    func fade(duration: Double = 1.5) {
        player.setVolume(0.0, fadeDuration: duration)
    }
}

class SoundManager {
    var oneShotSounds: [SoundItem] = []
    var sounds: [SoundItem] = []

    init() {}

    func create(_ filename: String) -> SoundItem? {
        guard let soundItem = SoundItem(filename) else {
            print("Cannot create sound item in sound manager for \(filename)")
            return nil
        }
        return soundItem
    }

    func playOnce(_ file: String) -> Int {
        guard let newSound = create(file) else {
            return 0
        }

        oneShotSounds.append(newSound)
        newSound.play()

        doAfter(newSound.duration * 2) {
            self.removeOneShot(newSound.soundID)
        }
        return newSound.duration
    }

    func removeOneShot(_ id: String) {
        if let index = oneShotSounds.firstIndex(where: { $0.soundID == id }) {
            print("removing \(index), have \(oneShotSounds.count) items")
            oneShotSounds.remove(at: index)
        }
    }

    private func doAfter(_ delay: Int, _ closure: @escaping () -> Void) {
        DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(delay), execute: closure)
    }
}
