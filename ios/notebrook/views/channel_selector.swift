import SwiftUI
import SwiftData

struct ChannelSelector: View {
    @State var dataManager: DataManager
    @State private var viewModel = ViewModel()
    @Environment(\.modelContext) private var modelContext
    @Query(sort: [SortDescriptor(\Channel.name)]) private var storedChannels: [Channel]
    @State private var showAuthAlert = false

    init(dataManager: DataManager) {
        self._dataManager = State(initialValue: dataManager)
        self._storedChannels = Query(filter: nil, sort: [SortDescriptor(\Channel.name)])
    }
    
    var body: some View {
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
                    NavigationLink(destination: MessagesView(channel: channel)) {
                        Text(channel.name)
                            .accessibilityLabel("Channel \(channel.name)")
                    }
                }
            }
        }
        .task {
            // Skip retrieval when not configured to avoid 401s
            guard !dataManager.getServer().isEmpty, !dataManager.getToken().isEmpty else { return }

            do {
                let remote = try await viewModel.getChannelList()
                // Save/update in SwiftData
                for ch in remote {
                    // upsert based on id
                    if let existing = storedChannels.first(where: { $0.id == ch.id }) {
                        existing.name = ch.name
                    } else {
                        modelContext.insert(Channel(name: ch.name, id: ch.id))
                    }
                }
                try? modelContext.save()
            } catch {
                showAuthAlert = true
            }
        }
        .alert("Error", isPresented: $showAuthAlert) {
            Button("OK") {
                dataManager.showOnboardingView = true
            }
        } message: {
            Text("Unauthorized. Please check your server and token.")
        }

    }
}
