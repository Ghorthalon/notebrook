import Foundation
import SwiftUI

extension ChannelSelector {
    @Observable
    class ViewModel {
        var channels: [Channel] = []
        
        func getChannelList() async throws -> [Channel] {
            let data = try await NotebrookService.makeRequest(path: "channels")
            let decoder = JSONDecoder()
            let response = try decoder.decode([String: [Channel]].self, from: data)
            return response["channels"] ?? []
        }
    }
    
}
