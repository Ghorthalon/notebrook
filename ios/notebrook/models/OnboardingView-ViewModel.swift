import Foundation
import SwiftUI

extension Onboarding {
    @Observable
    class ViewModel {
        var serverUrl = ""
        var serverToken = ""
        var serverConfigurationError = false
        var serverConfigurationSuccess = false
        var authorizationErrorText = ""

        func checkServerDetails() async throws {
            do {
                let ok = try await NotebrookService.checkTokenValidity(serverUrl: serverUrl, serverToken: serverToken)
                if !ok { throw ApplicationError.InvalidResponse }
            } catch {
                throw ApplicationError.InvalidResponse
            }
        }
    }
}
