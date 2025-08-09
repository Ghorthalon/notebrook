import Foundation

enum ApplicationError: Error {
    case InvalidResponse
    case InvalidUrl
    case InvalidJson
    case MissingCredentials
}
