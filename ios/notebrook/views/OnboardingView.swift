import SwiftUI

@MainActor
struct Onboarding: View {
    @State var dataManager: DataManager
    @State private var viewModel = ViewModel()

    private let NOTEBROOK_URL = "https://github.com/ogomez92/notebrook"

    init(dataManager: DataManager) {
        self._dataManager = State(initialValue: dataManager)
        let vm = ViewModel()
        vm.serverUrl = dataManager.getServer()
        vm.serverToken = dataManager.getToken()
        self._viewModel = State(initialValue: vm)
    }

    var body: some View {
        VStack {
            Text("Welcome to Notebrook")
                .font(.title)

            Text("It looks like your Notebrook server is not configured yet. You will need a Notebrook server (which is self hosted) to use this app.")
                .font(.subheadline)

            TextField("https://mynotebrook.com/api", text: $viewModel.serverUrl)
                .padding()
                .accessibility(label: Text("Server URL"))
                .textFieldStyle(RoundedBorderTextFieldStyle())

            TextField("test123", text: $viewModel.serverToken)
                .padding()
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .accessibility(label: Text("Auth token"))

            Button("Check and Save") {
                Task {
                    do {
                        try await viewModel.checkServerDetails()
                        await MainActor.run {
                            dataManager.saveServerDetails(viewModel.serverUrl, viewModel.serverToken)
                            dataManager.showOnboardingView = false
                            print("done")
                            // Play login sound on successful configuration
                            _ = SoundManager.shared.playOnce("login")
                        }
                    } catch ApplicationError.InvalidResponse {
                        viewModel.serverConfigurationError = true
                        viewModel.authorizationErrorText = "The server is invalid"
                    } catch ApplicationError.InvalidUrl {
                        viewModel.serverConfigurationError = true
                        viewModel.authorizationErrorText = "The URL you provided is invalid"
                    } catch {
                        viewModel.serverConfigurationError = true
                        viewModel.authorizationErrorText = "There was an error checking your server token."
                    }

                }

            }
            .padding()
            .disabled((viewModel.serverUrl.isEmpty || viewModel.serverToken.isEmpty))
            Link(destination: URL(string: NOTEBROOK_URL)!) {
                Text("Need to configure your Notebrook server? Visit \(NOTEBROOK_URL)")
            }
            .padding()
        }
        .padding()
        .alert("Error", isPresented: $viewModel.serverConfigurationError) {
            Button("OK", role: .cancel) { }
        } message: {

            Text(viewModel.authorizationErrorText)
        }

    }
}
