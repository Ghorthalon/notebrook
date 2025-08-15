import SwiftUI
import SwiftData
import AVFoundation
import Speech

struct MessagesView: View {
    let channel: Channel

    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @Query private var messages: [Message]
    @State private var draft: String = ""
    @State private var syncing = false
    @StateObject private var network = NetworkMonitor.shared
    private let sound = SoundManager.shared
    // @StateObject private var speech = SpeechManager()
    @State private var showDeleteChannelAlert = false
    @State private var showSpeechPermissionAlert = false
    @Environment(\.horizontalSizeClass) private var hSizeClass

    init(channel: Channel) {
        self.channel = channel
        // Capture id as value to avoid keyPath-to-keyPath predicate
        let cid = channel.id
        let predicate = #Predicate<Message> { $0.channelId == cid }
        _messages = Query(filter: predicate, sort: [SortDescriptor(\Message.createdAt, order: .forward)])
    }

    // Token reflecting the latest visible state to trigger scrolls
    private var bottomChangeToken: String {
        guard let last = messages.last else { return "" }
        let ts = last.createdAt.timeIntervalSince1970
        let pending = last.isPending ? 1 : 0
        let sid = last.serverId ?? -1
        return "\(ts)-\(pending)-\(sid)"
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
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
                    // Invisible anchor to scroll to bottom reliably
                    Color.clear.frame(height: 1).id("__bottom__")
                }
                .onAppear {
                    withAnimation { proxy.scrollTo("__bottom__", anchor: .bottom) }
                }
                .onChange(of: messages.count) { _ in
                    withAnimation { proxy.scrollTo("__bottom__", anchor: .bottom) }
                }
                .onChange(of: bottomChangeToken) { _ in
                    withAnimation { proxy.scrollTo("__bottom__", anchor: .bottom) }
                }
            }
            .accessibilityIdentifier("messagesList")

            Divider()
            HStack {
                TextField("Message", text: $draft, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .accessibilityLabel("Message input")
                if draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    /* Voice record button when draft is empty
                    ZStack {
                        Circle()
                            .fill(speech.isRecording ? Color.red.opacity(0.9) : Color.blue.opacity(0.9))
                            .frame(width: 36, height: 36)
                        Image(systemName: speech.isRecording ? "waveform" : "mic.fill")
                            .foregroundColor(.white)
                            .imageScale(.small)
                    }
                    .accessibilityLabel("Voice Message")
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { _ in
                                if !speech.isRecording { Task { await startVoice() } }
                            }
                            .onEnded { _ in
                                stopVoice()
                            }
                    )*/
                } else {
                    Button(action: sendDraft) {
                        Image(systemName: "paperplane.fill")
                            .imageScale(.large)
                    }
                    .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .accessibilityLabel("Send")
                }
            }
            .padding(.all, 8)
        }
        .navigationTitle(channel.name)
        .task { await syncMessages() }
        .onChange(of: network.isOnline) { _, isOnline in
            if isOnline {
                Task {
                    let outbox = OutboxActor(modelContainer: modelContext.container)
                    await outbox.process()
                    await syncMessages()
                }
            }
        }
        .alert("Speech Permission Needed", isPresented: $showSpeechPermissionAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("Enable microphone and speech recognition in Settings to use voice input.")
        }
        .alert("Delete Channel?", isPresented: $showDeleteChannelAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) { Task { await deleteCurrentChannel() } }
        } message: {
            Text("This removes the channel and its messages.")
        }
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                // Status indicator: pill with system colors and text, compact-aware
                let isCompact = (hSizeClass == .compact)
                Group {
                    if !network.isOnline {
                        statusPill(color: .red, text: isCompact ? "Off" : "Offline")
                            .accessibilityLabel("Sync Status: Offline")
                    } else if messages.contains(where: { $0.isPending }) {
                        statusPill(color: .yellow, text: isCompact ? "Pend" : "Pending")
                            .accessibilityLabel("Sync Status: Pending messages")
                    } else {
                        statusPill(color: .green, text: isCompact ? "Syn" : "Synced")
                            .accessibilityLabel("Sync Status: All messages synced")
                    }
                }
                Menu {
                    Button {
                        dataManager.setDefaultChannelId(channel.id)
                    } label: {
                        Label("Make Default", systemImage: "star")
                    }
                    Button(role: .destructive) {
                        showDeleteChannelAlert = true
                    } label: {
                        Label("Delete Channel", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .accessibilityLabel("More Options")
                }
            }
        }
    }

    // Reusable pill view for status indicator
    @ViewBuilder
    private func statusPill(color: Color, text: String) -> some View {
        let isCompact = (hSizeClass == .compact)
        HStack(spacing: isCompact ? 4 : 6) {
            Image(systemName: "circle.fill").foregroundStyle(color)
            Text(text)
        }
        .font(isCompact ? .caption2 : .caption)
        .padding(.horizontal, isCompact ? 6 : 8)
        .padding(.vertical, isCompact ? 2 : 4)
        .background(.thinMaterial, in: Capsule())
        .overlay(Capsule().stroke(Color.secondary.opacity(0.3), lineWidth: 0.5))
        .allowsHitTesting(false)
        .accessibilityElement(children: .ignore)
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
        send(content: trimmed) {
            draft = ""
        }
    }

    private func send(content: String, after: @escaping () -> Void = {}) {
        // Play "enter" sound when user presses send
        _ = sound.playOnce("enter_message")
        let local = Message(serverId: nil, channelId: channel.id, content: content, createdAt: Date(), isPending: true)
        modelContext.insert(local)
        after()
        // Try to send immediately if online; otherwise enqueue
        Task {
            if NetworkMonitor.shared.isOnline {
                do {
                    let sent = try await NotebrookService.sendMessage(channelId: channel.id, content: local.content)
                    await MainActor.run {
                        local.serverId = sent.serverId
                        local.createdAt = sent.createdAt
                        local.isPending = false
                        // Play a random "sent" confirmation when the server acknowledges
                        _ = sound.playOnce("sent\(Int.random(in: 1...6))")
                    }
                } catch {
                    await MainActor.run { enqueueSend(for: local) }
                }
            } else {
                await MainActor.run { enqueueSend(for: local) }
            }
            await MainActor.run { try? modelContext.save() }
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
                    await MainActor.run { modelContext.delete(message) }
                } catch {
                    await MainActor.run { enqueueDelete(for: message) }
                }
            } else {
                await MainActor.run { enqueueDelete(for: message) }
            }
            await MainActor.run { try? modelContext.save() }
        }
    }

    private func enqueueDelete(for message: Message) {
        let item = OutboxItem(action: "delete", channelId: message.channelId, content: nil, message: message)
        modelContext.insert(item)
        // For immediate feedback in offline, mark pending; we will actually delete once processed
        message.isPending = true
    }

    // Voice recording helpers
    private func startVoice() async {
        /*let ok = await speech.requestAuthorization()
        guard ok else { showSpeechPermissionAlert = true; return }
        do {
            try speech.startRecording { transcript in
                if let text = transcript, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    send(content: text)
                }
            }
        } catch {
            showSpeechPermissionAlert = true
        }
         */
    }

    private func stopVoice() {
        /*
        speech.stopRecording()
         */
    }

    private func deleteCurrentChannel() async {
        // Try remote deletion if online; ignore errors
        if NetworkMonitor.shared.isOnline {
            try? await NotebrookService.deleteChannel(channelId: channel.id)
        }
        // Remove local messages and channel
        do {
            // Capture id as value to avoid keyPath-to-keyPath predicate
            let cid = channel.id
            let pred = #Predicate<Message> { $0.channelId == cid }
            let desc = FetchDescriptor<Message>(predicate: pred)
            let toDelete = try modelContext.fetch(desc)
            for m in toDelete { modelContext.delete(m) }
            modelContext.delete(channel)
            try? modelContext.save()
        } catch { }
        dismiss()
    }
}
