import Foundation
import Network
import SwiftData

class NetworkMonitor: ObservableObject {
    static let shared = NetworkMonitor()

    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitorQueue")
    @Published private(set) var isOnline: Bool = true

    private init() {
        monitor.pathUpdateHandler = { [weak self] path in
            let online = path.status == .satisfied
            DispatchQueue.main.async {
                self?.isOnline = online
            }
            // Views observe isOnline and trigger outbox processing with their contexts
        }
        monitor.start(queue: queue)
    }
}

actor OutboxProcessor {
    static let shared = OutboxProcessor()

    func processOutbox(using context: ModelContext) async {
        guard NetworkMonitor.shared.isOnline else { return }
        do {
            let descriptor = FetchDescriptor<OutboxItem>(sortBy: [SortDescriptor(\OutboxItem.createdAt, order: .forward)])
            let items = try context.fetch(descriptor)
            for item in items {
                switch item.action {
                case "send":
                    if let msg = item.message, let content = item.content {
                        do {
                            let sent = try await NotebrookService.sendMessage(channelId: item.channelId, content: content)
                            msg.serverId = sent.serverId
                            msg.createdAt = sent.createdAt
                            msg.isPending = false
                            context.delete(item)
                            try context.save()
                        } catch {
                            // keep in outbox
                        }
                    } else {
                        context.delete(item)
                    }
                case "delete":
                    if let msg = item.message, let serverId = msg.serverId {
                        do {
                            try await NotebrookService.deleteMessage(channelId: item.channelId, serverMessageId: serverId)
                            context.delete(msg)
                            context.delete(item)
                            try context.save()
                        } catch {
                            // keep
                        }
                    } else {
                        if let msg = item.message { context.delete(msg) }
                        context.delete(item)
                    }
                default:
                    context.delete(item)
                }
            }
        } catch { }
    }
}
