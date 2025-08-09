import SwiftUI
import SwiftData

struct ContentView: View {
    @State  var dataManager: DataManager
    @Environment(\.modelContext) private var modelContext
    @StateObject private var network = NetworkMonitor.shared

    init(dataManager: DataManager) {
        self._dataManager = State(initialValue: dataManager)
        // If no configuration exists yet, start at onboarding immediately
        if dataManager.getServer().isEmpty || dataManager.getToken().isEmpty {
            dataManager.showOnboardingView = true
        }
    }

    var body: some View {
        NavigationStack {
            if dataManager.showOnboardingView {
                Onboarding(dataManager: dataManager)
            } else {
                AppView(dataManager: dataManager)
            }
        }
        .navigationTitle("Notebrook")
        .toolbar {
            Button("More Options", action: {
                // TODO present a sheet to forget the server, etc
            })
        }

        .task {
            let server = dataManager.getServer()
            let token = dataManager.getToken()
            // If creds are missing, show onboarding immediately
            guard !server.isEmpty, !token.isEmpty else {
                dataManager.showOnboardingView = true
                return
            }

            if network.isOnline {
                do {
                    let isValid = try await NotebrookService.checkTokenValidity(serverUrl: server, serverToken: token)
                    if isValid {
                        dataManager.showOnboardingView = false
                        // Warm up cache in background with a model actor
                        let cache = CacheActor(modelContainer: modelContext.container)
                        await cache.warmup()
                    } else {
                        dataManager.showOnboardingView = true
                    }
                } catch {
                    // Invalid or server unreachable
                    dataManager.showOnboardingView = true
                }
            } else {
                // Offline but have creds — proceed using cache
                dataManager.showOnboardingView = false
            }
        }
        .onChange(of: network.isOnline) { _, isOnline in
            // When we come back online and have creds, refresh cache and flush outbox
            if isOnline && !dataManager.getServer().isEmpty && !dataManager.getToken().isEmpty {
                Task {
                    let cache = CacheActor(modelContainer: modelContext.container)
                    await cache.warmup()
                    let outbox = OutboxActor(modelContainer: modelContext.container)
                    await outbox.process()
                    // Refresh cache again so the view context sees cleared pending flags
                    await cache.warmup()
                }
            }
        }
    }
}
