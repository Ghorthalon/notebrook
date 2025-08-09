import Foundation
import SwiftUI

extension ChannelSelector {
    @Observable
    class ViewModel {
        var channels: [Channel] = []
        
        func getChannelList() async -> [Channel] {
            do {
                let data = try await NotebrookService.makeRequest(path: "channels")
                let decoder = JSONDecoder()
                
                // Decode the response directly using a dictionary
                let response = try decoder.decode([String: [Channel]].self, from: data)
                
                // Access the channels array using the key
                return response["channels"] ?? []
            } catch {
                print("error \(error)")
                return []
            }
        }
    }
    
}

