import Foundation
import SwiftData

@Model
class Channel: Decodable {
    var name: String
    @Attribute(.unique) var id: Int
    
    init(name: String, id: Int) {
        self.name = name
        self.id = id
    }
    
    
    required init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        name = try container.decode(String.self, forKey: .name)
        id = try container.decode(Int.self, forKey: .id)
    }

    // Define the keys used for decoding
    private enum CodingKeys: String, CodingKey {
        case name
        case id
    }

}
