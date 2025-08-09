import SwiftUI

struct ContentView: View {
    @State  var dataManager: DataManager

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

        .task({
            checkInternetConnection { isConnected in
                if !isConnected {
                    dataManager.showOnboardingView = false
                    return
                } else {
                }
            }
            
            do {
                let server = dataManager.getServer()
                let token = dataManager.getToken()
                let _ = try await NotebrookService.checkTokenValidity(serverUrl: server, serverToken: token)
            } catch {
                dataManager.showOnboardingView = true
            }
        })
    }
}
