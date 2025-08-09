import Foundation
import SwiftData

@ModelActor
actor OutboxActor {
    func process() async {
        guard NetworkMonitor.shared.isOnline else { return }
        do {
            let descriptor = FetchDescriptor<OutboxItem>(sortBy: [SortDescriptor(\OutboxItem.createdAt, order: .forward)])
            let items = try modelContext.fetch(descriptor)
            for item in items {
                switch item.action {
                case "send":
                    if let msg = item.message, let content = item.content {
                        do {
                            let sent = try await NotebrookService.sendMessage(channelId: item.channelId, content: content)
                            msg.serverId = sent.serverId
                            msg.createdAt = sent.createdAt
                            msg.isPending = false
                            modelContext.delete(item)
                            try modelContext.save()
                        } catch {
                            // keep in outbox on error
                        }
                    } else {
                        modelContext.delete(item)
                    }
                case "delete":
                    if let msg = item.message, let serverId = msg.serverId {
                        do {
                            try await NotebrookService.deleteMessage(channelId: item.channelId, serverMessageId: serverId)
                            modelContext.delete(msg)
                            modelContext.delete(item)
                            try modelContext.save()
                        } catch {
                            // keep
                        }
                    } else {
                        if let msg = item.message { modelContext.delete(msg) }
                        modelContext.delete(item)
                    }
                default:
                    modelContext.delete(item)
                }
            }
        } catch { }
    }
}

