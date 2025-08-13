import Foundation
import SwiftUI

@Observable
class DataManager {
    var showOnboardingView = false
    
    func hasCredentials() -> Bool {
        return !getServer().isEmpty && !getToken().isEmpty
    }

    func saveServerDetails(_ server: String, _ token: String) {
        // Normalize: trim whitespace and drop trailing slash on server
        var normalizedServer = server.trimmingCharacters(in: .whitespacesAndNewlines)
        while normalizedServer.hasSuffix("/") { normalizedServer.removeLast() }
        let normalizedToken = token.trimmingCharacters(in: .whitespacesAndNewlines)
        UserDefaults.standard.set(normalizedServer, forKey: "server")
        UserDefaults.standard.set(normalizedToken, forKey: "token")
    }

    func getServer() -> String {
        return UserDefaults.standard.string(forKey: "server") ?? ""
    }

    func getToken() -> String {
        return UserDefaults.standard.string(forKey: "token") ?? ""
    }

    func deleteServer() {
        UserDefaults.standard.removeObject(forKey: "server")
        UserDefaults.standard.removeObject(forKey: "token")
        showOnboardingView =  true
    }

    // Default channel management
    func setDefaultChannelId(_ id: Int?) {
        if let id {
            UserDefaults.standard.set(id, forKey: "default_channel_id")
        } else {
            UserDefaults.standard.removeObject(forKey: "default_channel_id")
        }
    }

    func getDefaultChannelId() -> Int? {
        let id = UserDefaults.standard.object(forKey: "default_channel_id") as? Int
        return id
    }

    func clearDefaultChannelId() {
        UserDefaults.standard.removeObject(forKey: "default_channel_id")
    }
}
