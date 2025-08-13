import SwiftUI
import SwiftData

struct ChannelSelector: View {
    @State var dataManager: DataManager
    @Environment(\.modelContext) private var modelContext
    @Query(sort: [SortDescriptor(\Channel.name)]) private var storedChannels: [Channel]
    @State private var showAuthAlert = false
    @State private var showForgetAlert = false
    // Value-based navigation (iOS 16+)
    @State private var navPath = NavigationPath()

    init(dataManager: DataManager) {
        self._dataManager = State(initialValue: dataManager)
        self._storedChannels = Query(filter: nil, sort: [SortDescriptor(\Channel.name)])
    }
    
    var body: some View {
        NavigationStack(path: $navPath) {
        List {
            if dataManager.getServer().isEmpty || dataManager.getToken().isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("No server configured")
                        .font(.headline)
                        .foregroundStyle(.secondary)
                        .accessibilityLabel("No server configured")
                    Button("Open Settings") {
                        dataManager.showOnboardingView = true
                    }
                    .buttonStyle(.borderedProminent)
                    .accessibilityLabel("Open Settings")
                }
            } else {
                if storedChannels.isEmpty {
                    Text("Retrieving channels…")
                        .accessibilityLabel("Retrieving channels")
                }
                ForEach(storedChannels, id: \.id) { channel in
                    NavigationLink(value: channel.id) {
                        Text(channel.name)
                            .accessibilityLabel("Channel \(channel.name)")
                    }
                }
            }
        }
        .navigationDestination(for: Int.self) { id in
            if let channel = storedChannels.first(where: { $0.id == id }) {
                MessagesView(channel: channel)
            } else {
                Text("Channel not found")
            }
        }
        }
        .task {
            // Skip retrieval when not configured to avoid 401s
            guard !dataManager.getServer().isEmpty, !dataManager.getToken().isEmpty else { return }

            do {
                let cache = CacheActor(modelContainer: modelContext.container)
                try await cache.refreshChannels()
            } catch {
                showAuthAlert = true
            }
        }
        .task(id: storedChannels.map { $0.id }) {
            if let defId = dataManager.getDefaultChannelId(),
               storedChannels.contains(where: { $0.id == defId }) {
                // Navigate programmatically to default channel
                navPath = NavigationPath()
                navPath.append(defId)
            }
        }
        .alert("Error", isPresented: $showAuthAlert) {
            Button("OK") {
                dataManager.showOnboardingView = true
            }
        } message: {
            Text("Unauthorized. Please check your server and token.")
        }
        .alert("Forget Server?", isPresented: $showForgetAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Forget", role: .destructive) { Task { await forgetServerAndWipe() } }
        } message: {
            Text("This deletes all local data and disconnects from the server.")
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button(role: .destructive) {
                        showForgetAlert = true
                    } label: {
                        Label("Forget Server", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .accessibilityLabel("More Options")
                }
            }
        }

    }

    private func forgetServerAndWipe() async {
        do {
            let mDesc = FetchDescriptor<Message>()
            let allM = try modelContext.fetch(mDesc)
            for m in allM { modelContext.delete(m) }
            let oDesc = FetchDescriptor<OutboxItem>()
            let allO = try modelContext.fetch(oDesc)
            for o in allO { modelContext.delete(o) }
            let cDesc = FetchDescriptor<Channel>()
            let allC = try modelContext.fetch(cDesc)
            for c in allC { modelContext.delete(c) }
            try modelContext.save()
        } catch { }
        dataManager.clearDefaultChannelId()
        dataManager.deleteServer()
    }
}
