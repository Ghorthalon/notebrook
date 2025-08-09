import Foundation
import SwiftUI

@Observable
class DataManager {
    var showOnboardingView = false

    func saveServerDetails(_ server: String, _ token: String) {
        UserDefaults.standard.set(server, forKey: "server")
        UserDefaults.standard.set(token, forKey: "token")
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
        showOnboardingView =  false
    }
}
