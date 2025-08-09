import SwiftUI
import SwiftData

struct MessagesView: View {
    let channel: Channel

    @Environment(\.modelContext) private var modelContext
    @Query private var messages: [Message]
    @State private var draft: String = ""
    @State private var syncing = false
    @StateObject private var network = NetworkMonitor.shared

    init(channel: Channel) {
        self.channel = channel
        // Capture id as value to avoid keyPath-to-keyPath predicate
        let cid = channel.id
        let predicate = #Predicate<Message> { $0.channelId == cid }
        _messages = Query(filter: predicate, sort: [SortDescriptor(\Message.createdAt, order: .forward)])
    }

    var body: some View {
        VStack(spacing: 0) {
            List {
                ForEach(messages) { message in
                    Text(message.content)
                        .accessibilityLabel("Message: \(message.content)")
                        .accessibilityHint(message.isPending ? "Pending send" : "")
                        .accessibilityAction(named: Text("Copy")) {
                            UIPasteboard.general.string = message.content
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            Button(role: .destructive) { delete(message) } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                        .accessibilityAction(named: Text("Delete")) { delete(message) }
                        .contextMenu {
                            Button(role: .destructive) { delete(message) } label: {
                                Label("Delete", systemImage: "trash")
                            }
                            Button { UIPasteboard.general.string = message.content } label: {
                                Label("Copy", systemImage: "doc.on.doc")
                            }
                        }
                        .overlay(alignment: .trailing) {
                            if message.isPending { ProgressView().controlSize(.mini) }
                        }
                }
            }
            .accessibilityIdentifier("messagesList")

            Divider()
            HStack {
                TextField("Message", text: $draft, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .accessibilityLabel("Message input")
                Button(action: sendDraft) {
                    Image(systemName: "paperplane.fill")
                        .imageScale(.large)
                }
                .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                .accessibilityLabel("Send")
            }
            .padding(.all, 8)
        }
        .navigationTitle(channel.name)
        .task { await syncMessages() }
        .onChange(of: network.isOnline) { _, isOnline in
            if isOnline { Task { await OutboxProcessor.shared.processOutbox(using: modelContext) } }
        }
    }

    @MainActor
    private func syncMessages() async {
        guard !syncing else { return }
        syncing = true
        defer { syncing = false }
        do {
            let remote = try await NotebrookService.getMessages(channelId: channel.id)
            for r in remote {
                // upsert by serverId
                if let serverId = r.serverId {
                    if let existing = messages.first(where: { $0.serverId == serverId }) {
                        existing.content = r.content
                        existing.createdAt = r.createdAt
                        existing.isPending = false
                    } else {
                        modelContext.insert(Message(serverId: serverId, channelId: r.channelId, content: r.content, createdAt: r.createdAt, isPending: false))
                    }
                }
            }
            try modelContext.save()
        } catch {
            // Offline or server error — rely on local cache
        }
    }

    private func sendDraft() {
        let trimmed = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        let local = Message(serverId: nil, channelId: channel.id, content: trimmed, createdAt: Date(), isPending: true)
        modelContext.insert(local)
        draft = ""
        // Try to send immediately if online; otherwise enqueue
        Task {
            if NetworkMonitor.shared.isOnline {
                do {
                    let sent = try await NotebrookService.sendMessage(channelId: channel.id, content: local.content)
                    local.serverId = sent.serverId
                    local.createdAt = sent.createdAt
                    local.isPending = false
                } catch {
                    enqueueSend(for: local)
                }
            } else {
                enqueueSend(for: local)
            }
            try? modelContext.save()
        }
    }

    private func enqueueSend(for message: Message) {
        let item = OutboxItem(action: "send", channelId: message.channelId, content: message.content, message: message)
        modelContext.insert(item)
    }

    private func delete(_ message: Message) {
        Task {
            if let serverId = message.serverId, NetworkMonitor.shared.isOnline {
                do {
                    try await NotebrookService.deleteMessage(channelId: message.channelId, serverMessageId: serverId)
                    modelContext.delete(message)
                } catch {
                    enqueueDelete(for: message)
                }
            } else {
                enqueueDelete(for: message)
            }
            try? modelContext.save()
        }
    }

    private func enqueueDelete(for message: Message) {
        let item = OutboxItem(action: "delete", channelId: message.channelId, content: nil, message: message)
        modelContext.insert(item)
        // For immediate feedback in offline, mark pending; we will actually delete once processed
        message.isPending = true
    }
}
