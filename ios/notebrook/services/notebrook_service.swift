import Foundation

struct APIMessageCreateResponse: Decodable {
    let id: Int
    let channelId: Int
    let content: String
    let createdAt: String
}

class NotebrookService {
    static     func checkTokenValidity(serverUrl: String, serverToken: String) async throws -> Bool {
        guard let server = URL(string: serverUrl + "/check-token") else {
            print("invalid url")
            throw ApplicationError.InvalidUrl
        }

        var request = URLRequest(url: server)
        request.setValue(serverToken, forHTTPHeaderField: "authorization")
        let (_, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            print("not ok")
            
            return false
        }
print("validated")
        return true
    }

    // Make the request and return JSON data. If not JSON, error out.
    static func makeRequest(path: String) async throws -> Data {
        let url = dataManager.getServer()
        let token = dataManager.getToken()

        // Do not attempt network calls without configuration
        guard !url.isEmpty, !token.isEmpty else {
            throw ApplicationError.MissingCredentials
        }

        guard let server = URL(string: url + "/" + path+"/") else {
            throw ApplicationError.InvalidUrl
        }

        var request = URLRequest(url: server)
        request.setValue(token, forHTTPHeaderField: "authorization")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            print("bad status code \(response)")
            throw ApplicationError.InvalidResponse
        }

        return data
    }

    static func getMessages(channelId: Int) async throws -> [Message] {
        let data = try await makeRequest(path: "channels/\(channelId)/messages")
        let decoder = JSONDecoder()
        let response = try decoder.decode([String: [Message]].self, from: data)
        return response["messages"] ?? []
    }

    static func getChannels() async throws -> [Channel] {
        let data = try await makeRequest(path: "channels")
        let decoder = JSONDecoder()
        let response = try decoder.decode([String: [Channel]].self, from: data)
        return response["channels"] ?? []
    }

    static func sendMessage(channelId: Int, content: String) async throws -> Message {
        let base = dataManager.getServer()
        let token = dataManager.getToken()
        guard let url = URL(string: base + "/channels/\(channelId)/messages/") else { throw ApplicationError.InvalidUrl }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue(token, forHTTPHeaderField: "authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body = ["content": content]
        req.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw ApplicationError.InvalidResponse
        }
        let decoder = JSONDecoder()
        let created = try decoder.decode(APIMessageCreateResponse.self, from: data)
        // Convert to local Message
        let formatter = ISO8601DateFormatter()
        let date = formatter.date(from: created.createdAt) ?? Date()
        return Message(serverId: created.id, channelId: created.channelId, content: created.content, createdAt: date, isPending: false)
    }

    static func deleteMessage(channelId: Int, serverMessageId: Int) async throws {
        let base = dataManager.getServer()
        let token = dataManager.getToken()
        guard let url = URL(string: base + "/channels/\(channelId)/messages/\(serverMessageId)/") else { throw ApplicationError.InvalidUrl }
        var req = URLRequest(url: url)
        req.httpMethod = "DELETE"
        req.setValue(token, forHTTPHeaderField: "authorization")
        let (_, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw ApplicationError.InvalidResponse
        }
    }

    static func deleteChannel(channelId: Int) async throws {
        let base = dataManager.getServer()
        let token = dataManager.getToken()
        guard let url = URL(string: base + "/channels/\(channelId)/") else { throw ApplicationError.InvalidUrl }
        var req = URLRequest(url: url)
        req.httpMethod = "DELETE"
        req.setValue(token, forHTTPHeaderField: "authorization")
        let (_, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw ApplicationError.InvalidResponse
        }
    }
}
