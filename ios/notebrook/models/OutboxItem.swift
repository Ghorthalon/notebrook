import Foundation
import SwiftData

@Model
class OutboxItem {
    // action: "send" or "delete"
    var action: String
    var channelId: Int
    var content: String?
    // Optional link to a message for updating state after processing
    @Relationship(deleteRule: .nullify) var message: Message?
    var createdAt: Date

    init(action: String, channelId: Int, content: String? = nil, message: Message? = nil, createdAt: Date = .init()) {
        self.action = action
        self.channelId = channelId
        self.content = content
        self.message = message
        self.createdAt = createdAt
    }
}

