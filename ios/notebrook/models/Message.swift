import Foundation
import SwiftData

@Model
class Message: Decodable {
    // Local identity is implicit by SwiftData; we store server id when present
    @Attribute(.unique) var serverId: Int?
    var channelId: Int
    var content: String
    var createdAt: Date
    var isPending: Bool

    init(serverId: Int? = nil, channelId: Int, content: String, createdAt: Date = .init(), isPending: Bool = false) {
        self.serverId = serverId
        self.channelId = channelId
        self.content = content
        self.createdAt = createdAt
        self.isPending = isPending
    }

    // Decodable conformance for API responses
    required init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let serverId = try? container.decode(Int.self, forKey: .id)
        let channelId = try container.decode(Int.self, forKey: .channelId)
        let content = try container.decode(String.self, forKey: .content)
        let createdAtStr = try? container.decode(String.self, forKey: .createdAt)
        let formatter = ISO8601DateFormatter()
        let createdAt = createdAtStr.flatMap { formatter.date(from: $0) } ?? Date()
        self.serverId = serverId
        self.channelId = channelId
        self.content = content
        self.createdAt = createdAt
        self.isPending = false
    }

    private enum CodingKeys: String, CodingKey {
        case id
        case channelId
        case content
        case createdAt
    }
}

