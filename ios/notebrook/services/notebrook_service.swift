import Foundation

class NotebrookService {
    static     func checkTokenValidity(serverUrl: String, serverToken: String) async throws -> Bool {
        guard let server = URL(string: serverUrl + "/check-token") else {
            throw ApplicationError.InvalidUrl
        }

        var request = URLRequest(url: server)
        request.setValue(serverToken, forHTTPHeaderField: "authorization")
        let (_, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            return false
        }

        return true
    }

    // Make the request and return JSON data. If not JSON, error out.
    static func makeRequest(path: String) async throws -> Data {
        let url = dataManager.getServer()
        let token = dataManager.getToken()

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

}
