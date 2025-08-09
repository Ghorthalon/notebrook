import Foundation
import SwiftData

@ModelActor
actor CacheActor {
    func refreshChannels() async throws {
        let channels = try await NotebrookService.getChannels()
        for ch in channels {
            if let existing = try? fetchChannel(id: ch.id) {
                existing.name = ch.name
            } else {
                modelContext.insert(Channel(name: ch.name, id: ch.id))
            }
        }
        try? modelContext.save()
    }

    func warmup() async {
        guard NetworkMonitor.shared.isOnline else { return }
        do {
            // Fetch channels
            let channels = try await NotebrookService.getChannels()
            for ch in channels {
                if let existing = try? fetchChannel(id: ch.id) {
                    existing.name = ch.name
                } else {
                    modelContext.insert(Channel(name: ch.name, id: ch.id))
                }
            }
            try? modelContext.save()

            // Fetch messages for each channel
            for ch in channels {
                do {
                    let messages = try await NotebrookService.getMessages(channelId: ch.id)
                    for r in messages {
                        if let sid = r.serverId, let existing = try? fetchMessageByServerId(serverId: sid) {
                            existing.content = r.content
                            existing.createdAt = r.createdAt
                            existing.isPending = false
                        } else {
                            modelContext.insert(Message(serverId: r.serverId, channelId: r.channelId, content: r.content, createdAt: r.createdAt, isPending: false))
                        }
                    }
                    try? modelContext.save()
                } catch { /* ignore per-channel error */ }
            }
        } catch { /* ignore warmup errors */ }
    }

    private func fetchChannel(id: Int) throws -> Channel? {
        let pred = #Predicate<Channel> { $0.id == id }
        var desc = FetchDescriptor<Channel>(predicate: pred)
        desc.fetchLimit = 1
        return try modelContext.fetch(desc).first
    }

    private func fetchMessageByServerId(serverId: Int) throws -> Message? {
        let pred = #Predicate<Message> { ($0.serverId ?? -1) == serverId }
        var desc = FetchDescriptor<Message>(predicate: pred)
        desc.fetchLimit = 1
        return try modelContext.fetch(desc).first
    }
}
